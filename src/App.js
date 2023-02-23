import './App.css';
import React from 'react';
import { keyframes } from 'styled-components';
import styled from 'styled-components';

import cloudySnowing from './icons/cloudy_snowing.svg';
import nightStay from './icons/night_stay.svg';
import rainy from './icons/rainy.svg';
import sunny from './icons/sunny.svg';
import thunderstorm from './icons/thunderstorm.svg';


let animationWipes = (wipeFrom, wipeTo) => keyframes`
  0% { stroke-dashoffset: ${314 - (314 * wipeFrom)} }
  100% { stroke-dashoffset: ${314 - (314 * wipeTo)}}
`;

let Circle = styled.circle`
  animation-name: ${(props) => animationWipes(props.wipeFrom, props.wipeTo)};
  animation-duration: 3s;
  animation-fill-mode: forwards;
`;

function Cell(props) {
  return (
    <li className={props.selected? "selected" : ""} onClick={props.onclick}>
      <div className={props.day? "day" : "night"}>
        <div className='cell-content'>
          <h3 className='time'>
            {props.time}
          </h3>
          <div className='weather'>
            <h3>
              {props.temperature.toFixed(2)}
              <sup>{props.unit}</sup>
            </h3>
            {props.weather}
          </div>
        </div>
      </div>
    </li>
  );
}

function Weather(props) {
  return (
    <div>
      <div className='icon outer weather-gauge'>
        {props.icon}
      </div>
    </div>
  );
}

function Temperature(props) {
  let prevTemp  = Math.round(props.prevTemp);
  let wipeFrom = (Math.min(Math.max(prevTemp, -15), 35) + 15) / 50;
  let temp = Math.round(props.temperature);
  let wipeTo = (Math.min(Math.max(temp, -15), 35) + 15) / 50;

  return (
    <div className='icon outer'>
      <svg viewBox='0 0 100 100' className='circle center'>
        <defs>
          <linearGradient id='linear' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#ff0059'/>
            <stop offset='100%' stopColor='#4346df'/>
          </linearGradient>
        </defs>
        <Circle cx='50' cy='50' r='40' stroke='url(#linear)' 
          wipeFrom={wipeFrom} wipeTo={wipeTo}/>
      </svg>
      <div className='icon inner center'>
        <div className='temperature center'>
          <h2>
            {temp}<sup>{props.unit}</sup>
          </h2>
        </div>
      </div>
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);

    let currentDate = new Date();

    this.state = {
      location: 'Berlin',
      date: currentDate,
      data: null,
      cellRefs: null,
      selectedIdx: 0,
      prevTemp: -45,
    }
  }

  componentDidMount() {
    this.update(this.state.date);
    this.setState({
      selectedIdx: this.state.date.getHours()
    })
  }
  
  incrementDate(days) {
    let newDate = new Date(this.state.date);
    newDate.setDate(newDate.getDate() + days);

    this.update(newDate);
  }

  updateIdx(idx) {
    if (this.state.data != null) {
      this.setState({ 
        prevTemp: this.state.data.hourly.temperature_2m[this.state.selectedIdx]
      });
      this.setState({
        selectedIdx: idx
      })
    } else {
      this.setState({
        prevTemp: 45,
        selectedIdx: idx
      })
    }
  }
  update(date) {
    try {
      if (this.state.data != null) {
        this.setState({
          prevTemp: this.state.data.hourly.temperature_2m[this.state.selectedIdx]
        })
      }


      let currentTime = date.toISOString().substring(0, 14) + "00";
      fetch('https://api.open-meteo.com/v1/forecast?' 
        + new URLSearchParams({
          latitude:52.52,
          longitude: 13.41,
          start_date: currentTime.substring(0, 10),
          end_date: currentTime.substring(0, 10)
        }) 
        + '&hourly=temperature_2m,weathercode&daily=sunrise,sunset&timezone=auto  '
      ).then((res) => res.json()).then((data) => {
        this.setState({
          date: date,
          data: data
        });
      });
    } catch (e) {
      console.log(e);
    }
  }
  render() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    let dateString = `${days[this.state.date.getDay()]}, ${this.state.date.getDate()} ${months[this.state.date.getMonth()]} ${this.state.date.getFullYear()}`;
    
    let cells = []
    let currentWeather = null;
    if (this.state.data != null) {
      let sunrise = this.state.data.daily.sunrise[0];
      let sunset = this.state.data.daily.sunset[0];
      for (let i=0; i<24; i++) {
        let icon = null;
        let alt = "";
        let weathercode = this.state.data.hourly.weathercode[i];

        
        let time = this.state.data.hourly.time[i];
        let day = (time >= sunrise && time <= sunset);

        if (weathercode < 50) {
          if (day) {  
            icon = sunny;
            alt = "sunny";
          } else {
            icon = nightStay;
            alt = "calm night";
          }
        } else if (weathercode < 71) {
          icon = rainy;
          alt = "rainy";
        } else if (weathercode < 85){
          icon = cloudySnowing;
          alt = "snowing";
        } else {
          icon = thunderstorm;
          alt = "thunderstorm";
        }

        let weatherIcon = (<img src={icon} alt={alt}/>);

        if (this.state.selectedIdx === i) {
          currentWeather = weatherIcon;
        }

        cells.push(<Cell 
          key={i}
          selected={(this.state.selectedIdx === i)} 
          time={time.substring(11, 16)} temperature={this.state.data.hourly.temperature_2m[i]}
          unit={this.state.data.hourly_units.temperature_2m} weather={weatherIcon} day={day}
          onclick={() => this.updateIdx(i)}
        />);
      }
    }

    return(
      <>
        <h1>{this.state.location}</h1>
        <div className='card'>
          <div className='date'>
            <div className='button' onClick={() => this.incrementDate(-1)}>
              <img src='./arrow_back.svg' style={{transform: 'translateX(15%)'}} alt='back arrow'/>
            </div>
            <div className='date-text'><h2>{dateString}</h2></div>
            <div className='button' onClick={() => this.incrementDate(1)}>
              <img src='./arrow_forward.svg' alt='forward arrow'/>
            </div>
          </div>
          
          <main>
            <div className='icon-container'>
              <Temperature 
                prevTemp={this.state.prevTemp}
                temperature={(this.state.data === null)? 0 : this.state.data.hourly.temperature_2m[this.state.selectedIdx]}
                unit={(this.state.data === null)? "°C" : this.state.data.hourly_units.temperature_2m}
              />
              <Weather icon={currentWeather}/>
            </div>
            
            <ul>
              {cells}
            </ul>
          </main>
        </div>
      </>
    );
  }
}

export default App;
