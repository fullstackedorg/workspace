# Core Concepts

The whys of everything about FullStacked.

## TypeScript

JavaScript is one incredible language, it's [the universal language](https://tinyclouds.org/javascript_containers#the-universal-scripting-language). Since the introduction of TypeScript, there are very few drawbacks and immensivly a lot of plus to use it. The main difficulty with TS (typescript) is transforming it to JS (javascript), but this is all taken care of by FullStacked.

## Docker

Fully using docker for the runtime in FullStacked was one the first big decision. Docker is a virtualization tool that allows to run scripts within isolated preconfigured environments (containers). Instead of having to install all the x, y, z build tools and runtimes, you can rely on the fact that if it works on your machine, it will work on any machine.

## Modular Design

In today's world, especially in web development, new libraries and new frameworks comes out very often. Choosing a single stack can feel limity and having to change your whole codebase with a single pull/merge request can be very risky. FullStacked allows to add a new dependency to your stack and migrate piece by piece until you can drop the old dependency. Learn more [here](../Create/Modular%20design.md).
