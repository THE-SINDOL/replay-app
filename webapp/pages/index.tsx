import React from "react";
import { Golos_Text } from "next/font/google";
import { Gloock } from "next/font/google";
import Head from "next/head";
import Waveform from "@/components/Waveform";
import Image from "next/image";

const golosText = Golos_Text({ subsets: ["latin"] });
const gloock = Gloock({ subsets: ["latin"], weight: "400" });

export default function Home() {
  const logDownload = (platform: string) => {
    window.gtag("event", "download", {
      platform,
    });
  };
  const logClick = (surface: string) => {
    window.gtag("event", "click", {
      surface,
    });
  };
  return (
    <>
      <Head>
        <title>Replay | RVC Audio Model Voice Cloning with UVR</title>
        <meta property="og:image" content="https://tryreplay.io/api/og" />
      </Head>
      <div>
        <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center p-[2em] md:p-[10em] bg-[#1B3A4B]">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-center bg-no-repeat bg-cover opacity-60"
            style={{
              backgroundImage: `url('/squiggle.png')`,
            }}
          />
          <main
            className={`flex flex-col items-center justify-center text-center text-white ${golosText.className} z-10 -mt-12`}
          >
            {/* Logo */}
            <h1 className="absolute top-2 md:top-4 left-8 md:left-12 text-[3em] md:text-[5em] font-[700] tracking-[-.08em]">
              Replay
            </h1>
            {/* Discord */}
            <a
              href="https://discord.gg/A5rgNwDRd4"
              target="_blank"
              rel="noreferrer"
              onClick={() => logClick("discord")}
            >
              <div className="hidden lg:flex flex-row gap-2 items-center absolute top-12 right-12 text-xl bg-white text-black p-4 rounded-md transform transition-transform duration-250 ease-in-out hover:scale-105">
                Join our Discord
                <img src="/discord-black.png" className="w-8 h-6 inline-block ml-2" alt="Discord" />
              </div>
            </a>

            {/* Intel Mac */}
            <a
              href="/download?platform=mac_x64"
              className="hidden lg:block absolute bottom-12 left-12 text-2xl transform transition-transform duration-250 ease-in-out hover:scale-105"
              onClick={() => logDownload("mac_intel")}
            >
              Download for Intel Macs
            </a>
            {/* Mac */}
            <a
              href="/download?platform=mac"
              className="hidden lg:block absolute bottom-12 text-2xl transform transition-transform duration-250 ease-in-out hover:scale-105"
              onClick={() => logDownload("mac")}
            >
              Download for Apple Silicon
            </a>
            {/* Windows */}
            <a
              href="/download?platform=windows"
              className="hidden lg:block absolute bottom-12 right-12 text-2xl transform transition-transform duration-250 ease-in-out hover:scale-105"
              onClick={() => logDownload("windows")}
            >
              Download for Windows
            </a>
            {/* Mobile Discord */}
            <div className="flex lg:hidden flex-col gap-2 items-center absolute bottom-12 ml-auto mr-auto text-sm">
              <div className="flex italic">Replay is currently only available for Desktop</div>
              <div className="flex italic">Join below to get updates on mobile apps</div>
              <div className="flexflex-row gap-2 items-center text-sm bg-white text-black p-4 rounded-md mt-4">
                <a
                  href="https://discord.gg/A5rgNwDRd4"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => logClick("discord")}
                >
                  Join our Discord
                </a>
                <img src="/discord-black.png" className="w-8 h-6 inline-block ml-2" alt="Discord" />
              </div>
            </div>
            {/* Copy */}
            <h2 className={`mt-2 text-[2em] md:text-[3em] ${gloock.className} lg:text-[3em]`}>
              Remix your favorite music with AI. In one click.
            </h2>
            {/* Promo Shot */}
            <div className="flex w-full lg:w-6/12 mt-10 items-end justify-center">
              <div className="hidden lg:block bg-white rounded-xl p-1 drop-shadow-xl w-full h-5/6 -mr-44 -ml-12">
                <img src="/product_shot.jpeg" className="rounded-lg" alt="Replay App" />
              </div>
              <div className="flex flex-col w-fill lg:w-8/10 lg:h-8/10 items-start bg-white z-10 rounded-lg p-4 text-black gap-4 drop-shadow-2xl lg:-mr-44 lg:-mb-12">
                <div className="flex items-center">
                  <div className="hidden md:block relative h-20 w-20 rounded-lg overflow-hidden">
                    <Image src="/favicon-192.png" alt="Image description" layout="fill" objectFit="cover" />
                  </div>
                  <div className="flex flex-col items-start justify-center md:ml-4 gap-1">
                    <h1 className="text-xl md:text-2xl font-bold text-left">{"Welcome to Replay"}</h1>
                    {/* large and very bold */}
                    <h2 className="text-black text-sm md:text-md">
                      <span className="hidden md:inline">Remixed as: </span>
                      <span className="bg-[#eee] px-3 py-1 rounded-full font-semibold">{"Kendrick Lamar"}</span>
                    </h2>
                    {/* slightly bolder */}
                    <h3 className="text-xs md:text-sm text-gray-400">{"7/30/2023"}</h3> {/* small, light grey text */}
                  </div>
                </div>
                <Waveform shareId={"bgu1v"} waveSize={40} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
