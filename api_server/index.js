const express = require("express");
require("dotenv").config();
const { generateSlug } = require("random-word-slugs");
const {
  ECSClient,
  RunTaskCommand,
  StopTaskCommand,
} = require("@aws-sdk/client-ecs");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const subscriber = new Redis(process.env.redisURI);

const app = express();

const PORT = process.env.PORT || 9000;

const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(9001, () => console.log(`Socket server started on port:9001`));

app.use(express.json());
const config = {
  CLUSTER:
    "arn:aws:ecs:us-east-1:202650939127:cluster/vercel-deployment-imran-cluster",
  TASK: "arn:aws:ecs:us-east-1:202650939127:task-definition/builder-task",
};

const ecsClient = new ECSClient({
  region: process.env.region,
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

app.post("/project", async (req, res) => {
  const { gitUrl, slug } = req.body;
  const projectSlug = slug ? slug : generateSlug();
  // Spin the ecs container on aws now
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [
          "subnet-085706d784fc73134",
          "subnet-0d2bfafb7e4edd6d0",
          "subnet-07516846a328f5430",
          "subnet-0439c6bdbc1ecb5d9",
          "subnet-0ee84bdd0ff028f17",
          "subnet-0fb352d7a81e2bac8",
        ],
        securityGroups: ["sg-0fe365a2086cdcdf0"],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "builder-container",
          environment: [
            {
              name: "GIT_REPO_URL",
              value: gitUrl,
            },
            {
              name: "PROJECT_ID",
              value: projectSlug,
            },
            {
              name: "region",
              value: process.env.region,
            },
            {
              name: "accessKeyId",
              value: process.env.accessKeyId,
            },
            {
              name: "secretAccessKey",
              value: process.env.secretAccessKey,
            },
            {
              name: "redisURI",
              value: process.env.redisURI,
            },
          ],
        },
      ],
    },
  });

  // Start the ECS task
  const data = await ecsClient.send(command);
  const taskId = data.tasks[0].taskArn.split("/").pop(); // Extract the task ID from the task ARN
  // Schedule stopping the ECS task after 10 minutes (600000 milliseconds)
  stopTaskAfterDelay(config.CLUSTER, taskId, 600000);
  res.json({
    status: "queued",
    data: {
      projectSlug,
      url: `http://${projectSlug}.localhost:8000`,
    },
  });
});

const startSubscribingRedis = async () => {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
};

const stopTaskAfterDelay = (cluster, taskId, delay) => {
  setTimeout(async () => {
    try {
      // Stop or terminate the ECS task
      const stopTaskCommand = new StopTaskCommand({
        cluster: cluster,
        task: taskId,
      });
      await ecsClient.send(stopTaskCommand);
      console.log("ECS task stopped or terminated after delay.");
    } catch (error) {
      console.error(
        "Error stopping or terminating ECS task after delay:",
        error
      );
    }
  }, delay);
};

startSubscribingRedis();

app.listen(PORT, () => {
  console.log(`API Server running on port:${PORT}`);
});
