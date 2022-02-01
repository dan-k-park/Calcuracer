import { COOKIE_NAME, __prod__ } from "./constants";
import "reflect-metadata";
import "dotenv-safe/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import mongoose from "mongoose";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { UserResolver } from "./resolvers/user";

const main = async () => {
  mongoose.connect(process.env.DATABASE_URL, () => {
    console.log("Connected to MongoDB");
  });

  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver],
      validate: false,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  // const RedisStore = connectRedis(session)
  // const redis = new Redis(process.env.REDIS_URL)
  // app.set("proxy", 1)
  // app.use(
  //   cors({
  //     origin: process.env.CORS_ORIGIN,
  //     credentials: true
  //   })
  // )

  // app.use(
  //   session({
  //     name: COOKIE_NAME,
  //     store: new RedisStore({client: redis, disableTouch: true}),
  //     secret: process.env.SESSION_SECRET,
  //     cookie: {
  //       maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
  //       httpOnly: true,
  //       sameSite: "lax",
  //     }
  //   })
  // )

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(parseInt(process.env.PORT), () => {
    console.log("server started on localhost:4000");
  });
};

main();

// const main = async () => {
//   mongoose.connect(process.env.DATABASE_URL);

//   const app = express();

//   // const RedisStore = connectRedis(session);
//   // const redis = new Redis(process.env.REDIS_URL);
//   app.set("proxy", 1);
//   app.use(
//     cors({
//       origin: process.env.CORS_ORIGIN,
//       credentials: true,
//     })
//   );

//   app.use(
//     session({
//       name: COOKIE_NAME,
//       // store: new RedisStore({ client: redis, disableTouch: true }),
//       secret: process.env.SESSION_SECRET,
//       cookie: {
//         maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
//         httpOnly: true,
//         sameSite: "lax",
//         secure: __prod__, // cookie only works in https
//         domain: __prod__ ? ".randomthingsgohere.com" : undefined,
//       },
//       saveUninitialized: false,
//       resave: false,
//     })
//   );

//   const apolloServer = new ApolloServer({
//     schema: await buildSchema({
//       resolvers: [UserResolver],
//       validate: false,
//     }),
//     context: ({ req, res }) => ({
//       req,
//       res,
//       // redis,
//     }),
//     plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
//   });

//   await apolloServer.start();

//   // Make graphql endpoint on express
//   apolloServer.applyMiddleware({
//     app,
//     cors: false,
//   });

//   app.listen(parseInt(process.env.PORT), () => {
//     console.log("server started on localhost:4000");
//   });
// };

// main().catch((err) => {
//   console.error(err);
// });
