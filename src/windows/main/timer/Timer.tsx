import React from "react";
import { MdPauseCircle, MdPlayCircle, MdSkipNext } from "react-icons/md";
import { VscDebugRestart } from "react-icons/vsc";
import toast from "react-hot-toast";

import { formatTime, playAudio } from "../../../utils";
import { Settings } from "../../../bindings/Settings";
import useTimer from "./useTimer";
import useGlobal from "../../../app/store";
import { SessionQueue } from "../../../bindings/SessionQueue";
import Button from "../../../components/Button";
import { CountdownCircleTimer } from "./CountdownCircleTimer";
import { ColorFormat } from "@/types";

interface TimerProps {
  settings: Settings;
  sessionQueue: SessionQueue | null;
}

const Timer: React.FC<TimerProps> = ({ settings, sessionQueue }) => {
  const timer = useTimer(settings, sessionQueue);
  const theme = useGlobal((state) => state.currentTheme);

  return (
    <div className="grow mx-auto w-fit flex flex-col gap-4 items-center">
      {theme && (
        <div className="relative group">
          <CountdownCircleTimer
            key={timer.key}
            isPlaying={timer.isRunning}
            duration={timer.duration * 60}
            onUpdate={timer.onUpdate}
            onComplete={() => {
              playAudio();
              timer.next();
            }}
            strokeWidth={8}
            size={168}
            colors={theme.primary_hex as ColorFormat}
            trailColor={theme.base_hex as ColorFormat}
          >
            {({ remainingTime }) => (
              <span className="text-4xl">{formatTime(remainingTime)}</span>
            )}
          </CountdownCircleTimer>
          <div className="absolute bottom-3 left-[70px] btn btn-ghost opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              transparent
              onClick={() => {
                timer.restart();
                toast("Session restarted", {
                  position: "top-center",
                  duration: 1200,
                });
              }}
            >
              <VscDebugRestart size={24} />
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center gap-0.5 text-sm brightness-75">
        <span>#{timer.iterations}</span>
        <span>
          {timer.type === "focus"
            ? "Time to focus!"
            : timer.type === "break"
            ? "Time for a break!"
            : "Time for a longer break!"}
        </span>
      </div>
      <div className="flex flex-row items-center justify-center gap-2 w-full h-10">
        {timer.isRunning ? (
          <Button
            transparent
            onClick={() => {
              timer.pause();
              toast("Session paused", {
                position: "top-center",
                duration: 1200,
              });
            }}
          >
            <MdPauseCircle size={48} />
          </Button>
        ) : (
          <Button
            transparent
            onClick={() => {
              timer.start();
              toast("Session started", {
                position: "top-center",
                duration: 1200,
              });
            }}
          >
            <MdPlayCircle size={48} />
          </Button>
        )}
        <div className="z-10 fixed right-4 bottom-3 btn btn-ghost">
          <Button
            transparent
            onClick={() => {
              timer.next(true);
              toast("Session skipped", {
                position: "top-center",
                duration: 1200,
              });
            }}
          >
            <MdSkipNext size={32} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
