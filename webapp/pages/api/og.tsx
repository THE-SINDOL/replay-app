import React from "react";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let title = (searchParams.get("title") || "").slice(0, 20);
  if (title.length < (searchParams.get("title")?.length || 0)) {
    title += "...";
  }
  const artist = searchParams.get("artist");
  const hasDetails = title || artist;
  const boldFont = await fetch(new URL("/public/GolosText-ExtraBold.ttf", import.meta.url)).then((res) =>
    res.arrayBuffer(),
  );
  const serifFont = await fetch(new URL("/public/Gloock-Regular.ttf", import.meta.url)).then((res) =>
    res.arrayBuffer(),
  );
  return new ImageResponse(
    (
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1B3A4B",
        }}
      >
        {/* Background Image */}
        <img
          src="https://tryreplay.io/squiggle.png"
          alt="Background"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            objectFit: "cover",
            width: "100%",
            height: "100%",
            opacity: 0.6,
          }}
        />

        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: "24px",
            right: "32px",
            color: "white",
            alignItems: "center",
          }}
        >
          <p>Made with</p>
          <span
            style={{
              fontSize: 50,
              fontWeight: 700,
              fontFamily: "Golos",
              letterSpacing: "-0.08em",
              marginLeft: "12px",
            }}
          >
            Replay
          </span>
        </div>

        {hasDetails ? (
          <div
            style={{
              display: "flex",
              color: "black",
              zIndex: 10,
              backgroundColor: "white",
              padding: "16px 24px",
              borderRadius: "12px",
              maxWidth: "85%",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                height: "160px",
                width: "160px",
                backgroundColor: "#eee",
                padding: "6px",
                borderRadius: "12px",
                fontSize: 120,
                marginRight: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              💿
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Title */}
              <div
                style={{
                  fontSize: 70,
                  fontFamily: "Gloock",
                  textAlign: "left",
                  overflow: "hidden",
                  minWidth: 0,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </div>

              {/* Artist */}
              <div
                style={{
                  fontSize: 40,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span>Remixed as: </span>
                <span
                  style={{
                    fontFamily: "Golos",
                    backgroundColor: "#eeeeee",
                    padding: "6px 12px",
                    borderRadius: "12px",
                    marginLeft: "12px",
                  }}
                >
                  {artist}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "white",
              zIndex: 10,
              fontWeight: 700,
              fontSize: 54,
              fontFamily: "Gloock",
            }}
          >
            Remix your favorite music with AI.
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 600,
      emoji: "fluent",
      fonts: [
        {
          name: "Golos",
          data: boldFont,
          style: "normal",
        },
        {
          name: "Gloock",
          data: serifFont,
          style: "normal",
        },
      ],
    },
  );
}
