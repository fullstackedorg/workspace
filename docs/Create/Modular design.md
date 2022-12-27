# Modular Design

A web app project consist of 3 things :

- WebApp (the frontend)

- Server (the backend)

- External Tools (database and third parties)

While all of theses can change, scale and grow at a different rate. Keeping all of them in sync is always a challenge. Here's how FullStacked approach could help you in building and growing your web app projects.

## WebApp

Nowadays, UI and CSS libraries releases at such a high rate. Trends evovle and we all want our interfaces to have the latest look. While setting it up is not always as simple as it should be, FullStacked provides templates to add it as fast as possible.

### Example

Let's say you start a cool looking web app with React. At some point you realise TailwindCSS could be a good addition to your stack, but the time needed to learn it and set it up blocks you. With FullStacked, it's just a command away!

![Modular Design Example](https://files.cplepage.com/fullstacked/modular-design-webapp.png)

## Server

Backend frameworks all have their pros and cons. Some are lightweight and rapid to set up, but catches drawbacks as your project grows and more collaborators work with the codebase. Others can be way to heavy to use at day 0, but comes built-in with incredible features to handle unexpected events. Switching backend frameworks can sound farfetched, but when it do happens, being able to transition at your own pace is quite lovely.

### Example

Let's say you start a project with the React-Express-MongoDB (MERN) stack. Some day you feel like you have too many endpoints to manage and would like more features from your backend framework so you'd like to move to NestJS. Now, with FullStacked, simply add it to your stack, both frameworks will live while you migrate endpoint by endpoint. Finally, when your migration is done, you'll be able to drop express. Learn more about server listeners [here](../Develop/Files%20structure/Server.md).

![Modular Design Example](https://files.cplepage.com/fullstacked/modular-design-server.png)

## External Tools

Anything that has a Docker image can be run within your stack. Nowadays, most open source project has the docker option. From CMSs like WordPress and Strapi to databases like MongoDB, Redis or PostgreSQL, you can run your stack with anything. Once you set it up, everything runs within the same network. Learn more about it [here](../Develop/Network.md).

### Example

![Modular Design Example](https://files.cplepage.com/fullstacked/modular-design-externals.png)
