import './App.css';
import { useState } from 'react';
import { keyframes } from 'styled-components';
import styled from 'styled-components';

function App() {
  let [temperature, setTemperature] = useState(0);
  let [location, setLocation] = useState('Berlin');
  let [unit, setUnit] = useState('°C');

  let animationWipes = keyframes`
    0% { stroke-dashoffset: 314 }
    100% { stroke-dashoffset: 0 }
  `;

  let Circle = styled.circle`
    stroke: url(#linear);
    cx: 50;
    cy: 50;
  `;


  // 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m,weathercode'
  
  fetch('https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({latitude:52.52, longitude: 13.41}) + '&hourly=temperature_2m,weathercode'
  ).then((res) => res.json()).then((data) => {
    let times = data.hourly.time;
    let idx = 0;
    
    let currentTime = new Date().toISOString().substring(0, 14) + "00";
    for (idx=0; idx<times.length; idx++) {
      if (times[idx] === currentTime) {
        break;
      }
    }
    let temp = Math.round(data.hourly.temperature_2m[idx]);
    setTemperature(temp);
    setUnit(data.hourly_units.temperature_2m);
  })
  return (
    <>
      <h1>{location}</h1>
      <div className='card center'>
          <div className='icon outer'>
            <svg viewBox='0 0 100 100' className='circle center'>
              <defs>
                <linearGradient id='linear' x1='0%' y1='0%' x2='100%' y2='100%'>
                  <stop offset='0%' stopColor='#ff0059'/>
                  <stop offset='100%' stopColor='#4346df'/>
                </linearGradient>
              </defs>
              <circle cx='50' cy='50' r='40' stroke='url(#linear)'/>
            </svg>
            <div className='icon inner center'>
              <div className='temperature center'>
                <h2>
                  {temperature}<sup>{unit}</sup>
                </h2>
              </div>
            </div>
          </div>
      </div>
    </>
  );
}

export default App;
