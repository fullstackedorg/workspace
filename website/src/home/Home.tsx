import {Button, Col, Container, Form, FormControl, InputGroup, Row} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from "@fortawesome/free-brands-svg-icons/faGithub";
import Hero from "website/src/home/Hero";

export default function () {
    return <><Container>
        <Row className={"my-10"} style={{position: "relative", zIndex: 1}}>
            <Col style={{width: "100%", maxWidth: 1100, margin: "0 auto"}}>
                <h1 id={"quote"} className={"display-3"}>
                    The only tool you need to build webapps in TypeScript.
                </h1>
                <div className={"mt-5"}>
                    <Button className={"me-2"} size={"lg"}>The Story</Button>
                    <Button variant={"secondary"} as={"a"} href={"/docs"} size={"lg"}>Get Started</Button>
                </div>
            </Col>
            <div id={"hero"}><Hero /></div>
        </Row>
    </Container>
    <hr style={{position: "relative", zIndex: 1}} />
    <Container style={{position: "relative", zIndex: 1}}>
        <div style={{width: "100%", maxWidth: 1100, margin: "0 auto"}}>
            <Row className={"justify-content-around mt-5"}>
                <Col lg={4} className={"mb-2"}>
                    <p><b>Create</b></p>
                    <p>
                        Skip all the config file setup and and server setup.
                        Begin rapidly with a reliable initial setup you know will last the scaling up of your app.
                    </p>
                </Col>
                <Col lg={4} className={"mb-2"}>
                    <p><b>Watch</b></p>
                    <p>
                        Don't waste time figuring out how to make your frontend and your backend listen to change and reload.
                        It's all taken care off! Start developing!
                    </p>
                </Col>
                <Col lg={4} className={"mb-2"}>
                    <p><b>Build</b></p>
                    <p>
                        When ready, build locally and deploy or setup your CI/CD to build and run
                        the output file! No magic to understand, everything starts with a single <span className={"code"}>node dist/index</span>.
                    </p>
                </Col>
            </Row>

            <Row className={"mt-3 mb-5 justify-content-center"}>
                <Col lg={8} className={"box py-4 px-5"}>
                    <Row className={"mb-5"}>
                        <Col className={"text-center"}><small><b>Work in progress...</b></small></Col>
                    </Row>
                    <Row className={"justify-content-around"}>
                        <Col lg={6} className={"mb-2"}>
                            <p><b>Test</b></p>
                            <p>
                                All you'll need to do is to write tests! Don't lose a second to setup the whole testing environment.
                                Plus we'll include code coverage and helpers for unit, end-to-end and integration tests!
                            </p>
                        </Col>
                        <Col lg={6} className={"mb-2"}>
                            <p><b>Deploy</b></p>
                            <p>
                                Template for Docker, Docker-Compose and Unix service will be developed and explained how to use.
                                A single command will allow you to deploy your application to the internet.
                            </p>
                        </Col>
                    </Row>
                </Col>
            </Row>


            <div className={"my-10"}>
                <div className={"display-4 text-center mb-5"}>
                    <div>Lean and straight-forward.</div>
                    <div style={{fontSize: "smaller"}} className={"text-muted"}>Currently using:</div>
                </div>

                <Row className={"text-center justify-content-evenly"}>
                    <Col className={"mb-5"} lg={4}>
                        <a style={{textDecoration: "none", color: "currentColor"}} href={"https://www.typescriptlang.org/"} target={"_blank"}>
                            <img style={{height: 40, marginTop: 5, marginBottom: 5}}
                                 src={require("website/src/images/ts-logo.png")} alt={"typescript logo"}/>
                            <div className={"my-2"}><b>Typescript</b></div>
                        </a>
                        <p>
                            Essential for any JS project to scale and collaborate on a larger level. If you never used it before,
                            it is really not a big learning curve and trust me, you won't regret it.
                        </p>
                    </Col>
                    <Col className={"mb-5"} lg={4}>
                        <a style={{textDecoration: "none", color: "currentColor"}} href={"https://reactjs.org/"} target={"_blank"}>
                            <img style={{height: 50}} src={require("website/src/images/react-logo.png")} alt={"React logo"}/>
                            <div className={"my-2"}><b>React</b></div>
                        </a>
                        <p>
                            One of the most used frontend library. A lot of documentation and resources available.
                            In the near future, we will add the support of alternative tools like&nbsp;
                            <a href={"https://vuejs.org/"} target={"_blank"}>VueJS</a> and&nbsp;
                            <a href={"https://svelte.dev/"} target={"_blank"}>Svelte</a>.
                        </p>
                    </Col>
                </Row>
                <Row className={"text-center justify-content-evenly"}>
                    <Col className={"mb-5"} lg={4}>
                        <a style={{textDecoration: "none", color: "currentColor"}} href={"https://expressjs.com/"} target={"_blank"}>
                            <img id={"express-logo"} style={{height: 30, marginTop: 10, marginBottom: 10}}
                                 src={require("website/src/images/express-logo.png")} alt={"Express logo"} />
                            <div className={"my-2"}><b>Express</b></div>
                        </a>
                        <p>
                            A light and easy to use web server framework. Fast to learn and allows to create beautiful Rest APIs.
                            Eventually, we will add the support of alternative tools like&nbsp;
                            <a href={"https://nestjs.com/"} target={"_blank"}>NestJS</a>&nbsp;
                            for projects that needs something more robust.
                        </p>
                    </Col>
                    <Col className={"mb-5"} lg={4}>
                        <a style={{textDecoration: "none", color: "currentColor"}} href={"https://esbuild.github.io/"} target={"_blank"}>
                            <img style={{height: 45, marginTop: 2.5, marginBottom: 2.5}}
                                 src={require("website/src/images/esbuild-logo.png")} alt={"esbuild logo"} />
                            <div className={"my-2"}><b>esbuild</b></div>
                        </a>
                        <p>
                            The glue that sticks everything together. The most powerful bundler out there. At this point, you won't
                            interact with this, but if you start doing unconventional stuff, you might have to override a few build configs.
                        </p>
                    </Col>
                </Row>
                <div className={"text-center text-muted"}><em>and more...</em></div>
            </div>


            <Row className={"my-10 text-center mx-auto"} style={{maxWidth: 600}}>
                <Col>
                    <div className={"display-4"}>Replace this</div>
                    <div className={"code box p-3 my-4"} style={{whiteSpace: "normal"}}>npm i react react-dom @types/react @types/react-dom webpack webpack-html-plugin
                        copy-webpack-plugin express body-parser @types/express morgan mocha nyc ...</div>
                    <div><b>for this</b></div>
                    <div className={"code box p-3 my-4"}>npm i fullstacked</div>
                    <Button className={"me-2"} as={"a"} href={"/docs/"}>Get started</Button>
                    <Button variant={"secondary"} as={"a"} target={"_blank"}
                            href={"https://github.com/CPLepage/fullstacked"}>View Code <FontAwesomeIcon icon={faGithub} /></Button>
                </Col>
            </Row>
        </div>
    </Container>
    <hr />
    <Container>
        <Row className={"my-5 justify-content-center"}>
            <Col lg={6}>
                <Form onSubmit={async e => {
                    e.preventDefault();
                    const email =(document.querySelector("#email") as HTMLInputElement).value;
                    const name =(document.querySelector("#name") as HTMLInputElement).value;
                    if(!email || !name)
                        return;

                    const container = e.currentTarget;
                    container.innerHTML = `<div class="my-4 text-center">Subscribing...</div>`;

                    const request = await fetch("/subscribe?email=" + email + "&name=" + name);
                    const response = await request.json();

                    if(response.success)
                        container.innerHTML = `<div class="my-4 text-center">Thanks for subscribing!</div>`;
                }}>
                    <div className={"mb-2"}><b>Stay informed.</b></div>
                    <InputGroup>
                        <FormControl id={"email"} placeholder="Email address" type={"email"}/>
                        <FormControl id={"name"} placeholder="Name" type={"text"}/>
                        <Button as={"input"} type={"submit"} value={"Subscribe"} />
                    </InputGroup>
                    <div className={"text-muted"}><small>Stay up to date with the latest news and release.</small></div>
                </Form>
            </Col>
        </Row>
    </Container>
    <hr />
    <Container className={"text-muted mb-3"}>
        <small>Copyright © 2022 <a href={"https://cplepage.com"} target={"_blank"}>CP Lepage</a></small>
    </Container></>
}
