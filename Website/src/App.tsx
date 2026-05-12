import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import "./App.css";

const WORDS = ["Local-first", "voice", "typing."];
const BARS = 6;

export default function App() {
    const [footer, setFooter] = useState(false);
    const [hovered, setHovered] = useState(false);

    return (
        <div className="root" onWheel={e => setFooter(e.deltaY > 0)}>
            <div className={`page ${footer ? "slid" : ""}`}>
                <div className="upper">
                    <img src="/logo.svg" alt="VSPR" className="logo" />
                    <h1 className="headline">
                        {WORDS.map((w, i) => (
                            <span key={i} className="word" style={{ animationDelay: `${0.05 + i * 0.09}s` }}>
                                {w}
                            </span>
                        ))}
                    </h1>
                </div>

                <div className="lower">
                    <div className="mockupwrap">
                        <img src="/mockup/app.webp" alt="App" className="mockup" />
                        <div className="fade" />
                        <div className="toolbar">
                            <div className="listen">
                                <div className="bars">
                                    {Array.from({ length: BARS }).map((_, i) => (
                                        <span key={i} className="bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                                <span className="listentext">Transcribing...</span>
                                <button className="stop"><span className="sq" /></button>
                            </div>
                            <div
                                className={`dlwrap ${hovered ? "dlhov" : ""}`}
                                onMouseEnter={() => setHovered(true)}
                                onMouseLeave={() => setHovered(false)}
                            >
                                <button className="dl">
                                    <span className="dllabel">Download</span>
                                    <span className="dlgh"><FaGithub /></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className={`footer ${footer ? "vis" : ""}`}>
                <span>VSPR — made with ❤️ by Aryan</span>
            </footer>
        </div>
    );
}