**Daniel Lizik <dg.lizik@gmail.com>**

## Meta/Git

The indicated requirements of the assignment are in the `phase-1-mvp` branch which targets `main`. Nothing else is added. This includes the main api requirements, testing and containerization.

I've added a few quick wins in a `phase-2-perf` branch (pm2, logging, added concurrency config in bullmq) as well as notes on what else we could do to improve the reliability of the service. You can view the diff here https://github.com/grug-brain/cogent-takehome/compare/phase-1-mvp...phase-2-perf

```
main <- phase-1-mvp <- phase-2-perf
```

## tldr give me the working demo

```
# make sure you have jq installed
$ brew install jq

# should output an image url, this step actually builds the docker image
$ sh demo.sh
```

## Running containers locally

```
# you can skip this step if you ran the demo first
$ docker build -t express .

$ docker compose up
```

This will start redis, express (already built if you ran the demo) and minimal compact thumbor (which comes baked in with nginx and other stuff).

## Example

```bash
# create job
$ curl -i -H "Content-Type: image/png" -XPOST 127.0.0.1:3000/job --data-binary "@my-image-path.png"
> { id: 1, status: "waiting" }

# lookup status
$ curl 127.0.0.1:3000/job/1
> { status: "done", url: "127.0.0.1/path/to/img }
```

## Api

Open the `spec.yml` file and you can view the swagger preview in vscode via https://marketplace.visualstudio.com/items?itemName=Arjun.swagger-viewer

## System design

There is an `architecture.excalidraw` file included in the repo. It diagrams the flows of the assignment requirements across all the components in the system and how each component is related. Please view it on excalidraw.com or via https://marketplace.visualstudio.com/items?itemName=pomdtr.excalidraw-editor

## Local development

```
$ docker compose up redis thumbor
$ npm run start:dev
```

This will run all dependencies, as well as the express server via `tsx` which will restart when source files are changed.

## Architectural/libs/tooling decisions & tradeoffs

I went with node/typescript/express because I know it well and can get something up and running quickly. Npm also has the `bullmq` package which I used for the queue implementation instead of reinventing the wheel myself.

Redis is a dependency of `bullmq`, so it was necessary as well.

I choose `minimalcompact/thumbor` because it self-proclaimed to be "the fastest way to get thumbor working". It also has a nginx reverse-proxy baked in to the image so for a MVP it can suffice as an image host.

Overall, my main objective for this assignment was to treat it as an MVP where velocity was the primary factor.

Bullmq cannot mock redis so the "integration" tests are more on the e2e side, see https://github.com/taskforcesh/bullmq/issues/86

However, of all the queue libs on npm, bullmq pretty much the best so I just went with that instead of wasting too much time trying to figure out how to mock redis at the connection level via https://github.com/moll/node-mitm or something.

If django/celery lets you mock redis, that would probably be a better option for DX. The image processing itself does not occur in the api service so IMO using python or node to host the queue is not that important of a question. Now, if you wanted to do the image processing with ImageMagick or something yourself which I would think is cpu intensive then node (single threaded) would not be a good choice for that.

## Next steps

There is some architectural changes described in the excalidraw files. Mainly, we would want to hold static assets in s3:

- uploading directly to thumbor will be removed in a later version (in general, separation of concerns)
- if thumbor goes down, then you lose access to the original images too
- accessing thumbor directly forces you to use the super clunky url format (where you specify the image processing params in the url path itself), this is hard to use and the specific thumbnail dimensions we want (100x100) cannot be canonicalized. Ideally the resulting thumbnail would be accessed via slug like site.com/thumbnails/smile.webp instead of like thumbor.site.com/unsafe/100x100/blah/foo/image/encoded-path-here.

## Other questions

> What would need to change to put your service into production?

Productionizing a docker container is something I don't have a lot of experience with. In real life I'd ask for help from the infra team or with enough time just learn how to provision my own resources in whatever cloud solution you're using. This is actually the ares I want to gain professional experience in the most.

> How could it be scaled up or down?

We can set the number of node clusters with env vars, provision extra resources for node js, etc.

> How will it handle a high load of requests?

We can implement an external load balancer, rate limit the api endpoints (max requests per period, or paid tokens), set limits on the size of the file upload.

> What can you do to monitor and manage your services?

Implement open telemetry
