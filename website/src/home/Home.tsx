import {Button, Col, Container, Form, FormControl, InputGroup, Row} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from "@fortawesome/free-brands-svg-icons/faGithub";
import Hero from "website/src/home/Hero";
import axios from "axios";

export default function () {
    return <>
        <style>{`
        #stack img{
            height: 60px;
            object-fit: contain;
        }
        `}</style>
        <Container>
            <Row className={"my-10"} style={{position: "relative", zIndex: 1}}>
                <Col style={{width: "100%", maxWidth: 1100, margin: "0 auto"}}>
                    <h1 id={"quote"} className={"display-3"}>
                        The only tool you need to build web apps in TypeScript.
                    </h1>
                    <div className={"mt-5"}>
                        <Button className={"me-2"} size={"lg"} as={"a"}
                                href={"https://cp-lepage.medium.com/creating-web-apps-the-tale-of-a-millennial-js-developper-667e4b90589a"}
                                target={"_blank"}>The Story</Button>
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
                            Skip all the config files and server setup.
                            Begin your projects rapidly and rely on an initial setup that will last while your app grows.
                        </p>
                    </Col>
                    <Col lg={4} className={"mb-2"}>
                        <p><b>Run</b></p>
                        <p>
                            Startup your app with all the needed third-parties app and software you need.
                            You won't need to install any local tools or database, everything will be taken care of.
                        </p>
                    </Col>
                    <Col lg={4} className={"mb-2"}>
                        <p><b>Watch</b></p>
                        <p>
                            Don't waste time figuring out how to make your frontend and your backend listen to change and reload.
                            It's all taken care off! Start developing!
                        </p>
                    </Col>
                </Row>

                <Row className={"justify-content-center"}>
                    <Col lg={4} className={"mb-2"}>
                        <p><b>Test</b></p>
                        <p>
                            All you'll need to do is to write tests! Don't lose a second to setup the whole testing environment.
                            Ready for unit, integration and end-2-end tests, you are all setup and you can even generate your code coverage!
                        </p>
                    </Col>
                    <Col lg={4} className={"mb-2"}>
                        <p><b>Deploy</b></p>
                        <p>
                            Rapidly deploy to the internet. A built-in command allows to send a production build directly to your
                            server. With a small version control, you'll be able to track the progress and revert in case of issues.
                        </p>
                    </Col>
                </Row>

            </div>
        </Container>
        <Container className={"my-10 text-center"}>
            <div className={"display-4 text-center mb-5"}><div style={{fontSize: "smaller"}} className={"text-muted"}>See FullStacked in action !</div></div>
            <iframe style={{width: "100%", maxWidth: 560, height: 315}}
                    src="https://www.youtube.com/embed/bxan9WjC4w8?rel=0"
                    title="YouTube video player" frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
        </Container>
        <Container>
            <div>
                <div className={"my-10"} id={"stack"}>
                    <div className={"display-4 text-center mb-5"}>
                        <div>Reproducible and trustworthy</div>
                        <div style={{fontSize: "smaller"}} className={"text-muted"}>Docker in the spotlight</div>
                    </div>

                    <Row className={"text-center justify-content-evenly"}>
                        <Col className={"mb-5"} lg={5}>
                            <a style={{textDecoration: "none", color: "currentColor"}} href={"https://www.typescriptlang.org/"} target={"_blank"}>
                                <img style={{width: 60}}
                                     src={require("website/src/images/docker-logo.png")} alt={"typescript logo"}/>
                                <div className={"my-2"}><b>Docker</b></div>
                            </a>
                            <p>
                                With FullStacked, your project will always run under a docker-compose to ensure the stability of the runtime environment.
                                Nowadays, most of us uses third-parties app and software to provide a complete set of tools.
                                FullStacked unleashes the power of docker-compose to efficiently setup a complete runtime environment and
                                be able to reproduce it anywhere.
                            </p>
                        </Col>
                    </Row>


                    <div className={"display-4 text-center mb-5"}>
                        <div>Build with tools of confidence</div>
                        <div style={{fontSize: "smaller"}} className={"text-muted"}>Currently using :</div>
                    </div>


                    <Row className={"text-center justify-content-evenly"}>
                        <Col className={"mb-5"} lg={4}>
                            <a style={{textDecoration: "none", color: "currentColor"}} href={"https://www.typescriptlang.org/"} target={"_blank"}>
                                <img style={{width: 45}}
                                     src={require("website/src/images/ts-logo.png")} alt={"typescript logo"}/>
                                <div className={"my-2"}><b>Typescript</b></div>
                            </a>
                            <p>
                                Essential to scale any JS project and to ease collaboration.
                                If you never used TypeScript before, but are used to JS, it is really not a big learning curve.
                                Trust me, you won't regret it.
                            </p>
                        </Col>
                        <Col className={"mb-5"} lg={4}>
                            <a style={{textDecoration: "none", color: "currentColor"}} href={"https://reactjs.org/"} target={"_blank"}>
                                <img style={{width: 50}} src={require("website/src/images/react-logo.png")} alt={"React logo"}/>
                                <div className={"my-2"}><b>React</b></div>
                            </a>
                            <p>
                                One of the most popular frontend library. A lot of documentation and resources are available.
                                In the near future, we will add the support of alternative tools like&nbsp;
                                <a href={"https://vuejs.org/"} target={"_blank"}>VueJS</a> and&nbsp;
                                <a href={"https://svelte.dev/"} target={"_blank"}>Svelte</a>.
                            </p>
                        </Col>
                    </Row>
                    <Row className={"text-center justify-content-evenly"}>
                        <Col className={"mb-5"} lg={4}>
                            <a style={{textDecoration: "none", color: "currentColor"}} href={"https://expressjs.com/"} target={"_blank"}>
                                <img id={"express-logo"} style={{width: 100}}
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
                            <a style={{textDecoration: "none", color: "currentColor"}} href={"https://mochajs.org/"} target={"_blank"}>
                                <img src={require("website/src/images/mocha-logo.png")} alt={"Mocha logo"} />
                                <div className={"my-2"}><b>Mocha</b></div>
                            </a>
                            <p>
                                Mocha is one of the most used JS test framework. Using <code>describe</code> and <code>it</code>,
                                writing tests is almost fun! The package <a href={"https://pptr.dev/"}>puppeteer</a> is built-in to create end-2-end tests
                                easily. You can also pair it with <a href={"https://www.chaijs.com/"}>chai</a> if you want more assert methods.
                            </p>
                        </Col>
                    </Row>

                    <Row className={"text-center justify-content-evenly"}>
                        <Col className={"mb-5"} lg={4}>

                            <a style={{textDecoration: "none", color: "currentColor"}} href={"https://esbuild.github.io/"} target={"_blank"}>
                                <img style={{width: 50}}
                                     src={require("website/src/images/esbuild-logo.png")} alt={"esbuild logo"} />
                                <div className={"my-2"}><b>esbuild</b></div>
                            </a>
                            <p>
                                The glue that sticks everything together. The most powerful bundler out there.
                                Incredibly fast!
                            </p>
                        </Col>
                    </Row>

                </div>


                <Row className={"my-10 mx-auto"} style={{maxWidth: 600}}>
                    <Col>
                        <div className={"display-4 text-center"}>Replace this</div>
                        <pre className={"p-3 my-4"} style={{whiteSpace: "normal"}}><code>npm i react react-dom @types/react @types/react-dom webpack webpack-html-plugin
                            copy-webpack-plugin express body-parser @types/express morgan mocha nyc ...</code></pre>
                        <div className={"text-center"}><b>for this</b></div>
                        <pre className={"p-3 my-4"}><code>npm i fullstacked</code></pre>
                        <div className={"text-center"}>
                            <Button className={"me-2"} as={"a"} href={"/docs/"}>Get started</Button>
                            <Button variant={"secondary"} as={"a"} target={"_blank"}
                                    href={"https://github.com/CPLepage/fullstacked"}>View Code <FontAwesomeIcon icon={faGithub} /></Button>
                        </div>
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

                        const response = await axios.post("/mailing/subscribe", {
                            name: name,
                            email: email
                        });

                        if(response.data.success)
                            container.innerHTML = `<div id="success-msg" class="my-4 text-center">Thanks for subscribing!</div>`;
                    }}>
                        <div className={"mb-2"}><b>Stay informed.</b></div>
                        <InputGroup>
                            <FormControl id={"email"} placeholder="Email address" type={"email"}/>
                            <FormControl id={"name"} placeholder="Name" type={"text"}/>
                            <Button id={"subscribe"} as={"input"} type={"submit"} value={"Subscribe"} />
                        </InputGroup>
                        <div className={"text-muted"}><small>Stay up to date with the latest news and release.</small></div>
                    </Form>
                </Col>
            </Row>
        </Container>
        <hr />
        <Container className={"text-muted mb-3"}>
            <small>Copyright © 2022 <a href={"https://cplepage.com"} target={"_blank"}>CP Lepage</a></small>
        </Container>
    </>
}
