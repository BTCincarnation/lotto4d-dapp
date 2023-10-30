import React, { useEffect, useState } from 'react';
import lotto4DToken from "./lottery";
import "./countDownTimer.css";
const CountDownTimer= () => {

  // State for timeLeft
  const [timeLeft, setTimeLeft] = useState(0); // Initial time in seconds

   // Fetch initial timeLeft when the component mounts
   useEffect(() => {
    const timeLeftUpdate  = async () => {

      const currentTimeCount = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
      
      const lastDrawTimestamp = await lotto4DToken.methods.getLastDrawTime().call();
      const drawTime = await lotto4DToken.methods.drawTime().call();
      
      const currentTimeNumber = parseInt(currentTimeCount, 10);
      const lastDrawTimestampNumber = parseInt(lastDrawTimestamp, 10); // Convert to a number
      const drawTimeNumber = parseInt(drawTime, 10);
      
      const nextDrawTime = lastDrawTimestampNumber + drawTimeNumber;
      // Calculate the time left until the next draw
      const timeLeftCount = nextDrawTime > currentTimeNumber ? nextDrawTime - currentTimeNumber : 0;

      return timeLeftCount;
    };
    timeLeftUpdate().then((initialTimeLeft) => {
      setTimeLeft(initialTimeLeft);
    });
  }, []);

  // Update timeLeft every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Check if timeLeft is greater than 0 before decreasing it
      if (timeLeft > 0) {
        setTimeLeft((prevTimeLeft) => prevTimeLeft - 1);
      }
    }, 1000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [timeLeft]);
  // Calculate hours, minutes, and seconds based on timeLeft
  const updatedHours = Math.floor(timeLeft / 3600);
  const updatedMinutes = Math.floor((timeLeft % 3600) / 60);
  const updatedSeconds = timeLeft % 60;
  return (
    <div className="countdown-title">
    <h3>Count down until next draw:</h3>

    <div className="countdown">
      {/* Render your countdown timer elements here */}
      <div className="bloc-time hours">
        <span className="count-title">Hours</span>
        <div className="figure hours hours-1">
          <span className="top">{updatedHours >= 10 ? Math.floor(updatedHours / 10) : 0}</span>
        </div>
        <div className="figure hours hours-2">
          <span className="top">{updatedHours % 10}</span>
        </div>
      </div>
      <div className="bloc-time min">
        <span className="count-title">Minutes</span>
        <div className="figure min min-1">
          <span className="top">{updatedMinutes >= 10 ? Math.floor(updatedMinutes / 10) : 0}</span>
        </div>
        <div className="figure min min-2">
          <span className="top">{updatedMinutes % 10}</span>
        </div>
      </div>
      <div className="bloc-time sec">
        <span className="count-title">Seconds</span>
        <div className="figure sec sec-1">
          <span className="top">{updatedSeconds >= 10 ? Math.floor(updatedSeconds / 10) : 0}</span>
        </div>
        <div className="figure sec sec-2">
          <span className="top">{updatedSeconds % 10}</span>
        </div>
      </div>
    </div>
    </div>
  );
}

export default CountDownTimer;
