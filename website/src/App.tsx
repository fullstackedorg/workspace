import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "website/src/home/Home";
import Docs from "website/src/docs/Docs";
import Layout from "website/src/layout/Layout";

export default function () {
    return <Router>
        <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/docs/*" element={<Layout><Docs /></Layout>} />
        </Routes>
    </Router>
}
