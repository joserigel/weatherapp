import './App.css';
import React, { createRef } from 'react';
import { keyframes } from 'styled-components';
import styled from 'styled-components';

// SearchBar import
import Search from './Search';

// Icons imports
import cloudySnowing from './icons/cloudy_snowing.svg';
import nightStay from './icons/night_stay.svg';
import rainy from './icons/rainy.svg';
import sunny from './icons/sunny.svg';
import thunderstorm from './icons/thunderstorm.svg';

// Stylized div to set radial wipe based on actual temperature
// Notice that 314 is when the temperature gauge is empty
// and 0 is when the temperature gauge is full
let animationWipes = (wipeFrom, wipeTo) => keyframes`
  0% { stroke-dashoffset: ${314 - (314 * wipeFrom)} }
  100% { stroke-dashoffset: ${314 - (314 * wipeTo)}}
`;

let Circle = styled.circle`
  animation-name: ${(props) => animationWipes(props.wipeFrom, props.wipeTo)};
  animation-duration: 3s;
  animation-fill-mode: forwards;
`;

// Temperature Gauge to show currently selected temperature
function Temperature(props) {
  // This calculation is for the keyframe based on the previous temperature and current temperature
  // Capped to be between -15 and 35
  let prevTemp  = Math.round(props.prevTemp);
  let wipeFrom = (Math.min(Math.max(prevTemp, -15), 35) + 15) / 50;
  let temp = Math.round(props.temperature);
  let wipeTo = (Math.min(Math.max(temp, -15), 35) + 15) / 50;

  return (
    <div className='icon outer'>
      {/* Temperature Gauge (outer circle with gradient and animation) */}
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
      {/* Temperature text with unit */}
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

// Cell to display time, temperature and weathercode
const Cell = React.forwardRef((props, ref) => {
  return (
    <li className={props.selected? "selected" : ""} onClick={props.onclick} ref={ref}>
        {/* className="selected" shows border and is only on the one that is currently selected*/}
        {/* day and night determines the color and to show whether the sun is out (blue=day, purple=night)*/}
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
            {/* This is where the weather icons are displayed */}
            {props.weather}
          </div>
        </div>
      </div>
    </li>
  );
});

// Big circle display right below the temperature gauge to
// show weather code currently being selected
function Weather(props) {
  return (
    <div>
      <div className='icon outer weather-gauge'>
        {props.icon}
      </div>
    </div>
  );
}


// MAIN Program
class App extends React.Component {
  constructor(props) {
    super(props);

    let currentDate = new Date();

    // This ref is necessary for the auto scrolling to the selected cell
    let refs = [];
    for (let i=0; i<24; i++) {
      refs.push(createRef());
    }

    // Setting up City and Coordinates to fetch and display data
    // based on the search param/query
    let search = new URLSearchParams(window.location.search);
    let lat, long, city;
    for (let value of search.entries()) {
        switch (value[0]) {
          case 'city':
            city = value[1];
            break;
          case 'latitude':
            lat = parseFloat(value[1]);
            break;
          default :
            long = parseFloat(value[1]);
        }
    }

    // flag is necessary to know that the search queries are valid,
    // if they aren't then it'll revert to showing the data for Berlin
    let flag = (!isNaN(long) && !isNaN(lat) && city != null)


    // Setting up of states
    this.state = {
      location: flag? city : 'Berlin',
      latitude: flag? lat: 52.52,
      longitude: flag? long: 13.41,
      date: currentDate,
      data: null,
      cellRefs: refs,
      selectedIdx: 0,
      prevTemp: -45,
    }
  }

  componentDidMount() {
    // Calls update initially to fetch data initially
    this.update(this.state.date);
    this.setState({
      selectedIdx: this.state.date.getHours()
    })
  }

  componentDidUpdate() {
    // OnUpdate should trigger to the selected cell
    let scrollRef = this.state.cellRefs[this.state.selectedIdx];
    if (scrollRef.current != null) {
      scrollRef.current.scrollIntoView({block: "center", inline: "center"});
    }
  }
  
  // next and back button event handler to change date to the next/prev one
  incrementDate(days) {
    let newDate = new Date(this.state.date);
    newDate.setDate(newDate.getDate() + days);

    // This checks if the desired date is more than 7 days after the current date
    let difference = Math.ceil((newDate - new Date()) / (1000 * 3600 * 24));
    if (difference <= 7) {
      this.update(newDate);
    }
  }

  // event handler to update selected index
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

  // Update function to update all displays to the given date
  update(date) {
    try {
      if (this.state.data != null) {
        this.setState({
          prevTemp: this.state.data.hourly.temperature_2m[this.state.selectedIdx]
        })
      }

      // Fetch data with fetch from Open-Meteo based on the date provided and coordinates
      // TODO: (might be better to use Axios, but currently it shows no difference)
      let currentTime = date.toISOString().substring(0, 14) + "00";
      fetch('https://api.open-meteo.com/v1/forecast?' 
        + new URLSearchParams({
          latitude: this.state.latitude,
          longitude: this.state.longitude,
          start_date: currentTime.substring(0, 10),
          end_date: currentTime.substring(0, 10)
        }) 
        // Below this are the configs, as in which datas are being fetched 
        // Currently it fetches temperature, weathercode, sunrise, and sunset
        // timezone is currently set to auto (meaning it corresponds hopefully to the respective locations)
        + '&hourly=temperature_2m,weathercode&daily=sunrise,sunset&timezone=auto'
      ).then((res) => res.json()).then((data) => {

        // Setting Data and date for Display
        this.setState({
          date: date,
          data: data
        });
        
        // Set the selected cell to the current hour, 
        // if the date is the current date
        let currentDate = new Date();
        if (date.getDate() !== currentDate.getDate() || date.getMonth() !== currentDate.getMonth() 
            || date.getFullYear() !== currentDate.getFullYear()) {
          this.setState({
            selectedIdx: 0
          })
        } else {
          this.setState({
            selectedIdx: currentDate.getHours()
          })
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  // RENDER LOOP
  render() {
    // Create Stringified Date {Day of the Week}, {Date} {Month} {Year}
    // e.g. Sunday, 23 March 2022
    const days = [
      "Sunday", "Monday", "Tuesday", 
      "Wednesday", "Thursday", "Friday", "Saturday"
    ];
    const months = [
      "January", "February", "March", "April", 
      "May", "June", "July", "August", "September", 
      "October", "November", "December"
    ];

    let dateString = `${days[this.state.date.getDay()]}, ${this.state.date.getDate()} ${months[this.state.date.getMonth()]} ${this.state.date.getFullYear()}`;
    
    let cells = []
    let currentWeather = null;
    if (this.state.data != null) {
      let sunrise = this.state.data.daily.sunrise[0];
      let sunset = this.state.data.daily.sunset[0];
      
      // Iterates for each cell (per hour in a day)
      for (let i=0; i<24; i++) {
        let icon = null;
        let alt = "";
        let weathercode = this.state.data.hourly.weathercode[i];

        // get time of day and weather the sun is out or not
        let time = this.state.data.hourly.time[i];
        let day = (time >= sunrise && time <= sunset);

        // WEATHER CODE, this defines the icon that will be displayed
        // based on the weathercode fetched from the API
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

        // Weather Icon variable
        let weatherIcon = (<img src={icon} alt={alt}/>);

        // Define the big Weather Icon to show the currently selected
        // Weather
        if (this.state.selectedIdx === i) {
          currentWeather = weatherIcon;
        }

        // Pushed the cell with datas as props
        cells.push(<Cell 
          key={i} ref={this.state.cellRefs[i]}
          selected={(this.state.selectedIdx === i)} 
          time={time.substring(11, 16)} temperature={this.state.data.hourly.temperature_2m[i]}
          unit={this.state.data.hourly_units.temperature_2m} weather={weatherIcon} day={day}
          onclick={() => this.updateIdx(i)}
        />);
      }
    }

    // The difference of day that is being displayed and the current date
    // This is to prevent the user from fetching anything after 7 days
    let difference = Math.ceil((this.state.date - new Date()) / (1000 * 3600 * 24));

    return(
      <>
        <Search/>
        
        <h1>{this.state.location}</h1>

        {/* main card (weather, date, etc) */}
        <div className='card'>
          <div className='date'>
            
            {/* Date display with buttons */}
            <div className='button' onClick={() => this.incrementDate(-1)}>
              <img src='./arrow_back.svg' style={{transform: 'translateX(15%)'}} alt='back arrow'/>
            </div>
            <div className='date-text'><h2>{dateString}</h2></div>
            <div className='button' onClick={() => this.incrementDate(1)} style={{opacity: (difference < 7)? 1 : 0}}>
              <img src='./arrow_forward.svg' alt='forward arrow'/>
            </div>
          </div>
          
          {/* This is the Cell area, with hourly datas */}
          <main>
            <div className='icon-container'>
              <Temperature 
                prevTemp={this.state.prevTemp}
                temperature={(this.state.data === null)? 0 : this.state.data.hourly.temperature_2m[this.state.selectedIdx]}
                unit={(this.state.data === null)? "°C" : this.state.data.hourly_units.temperature_2m}
              />
              <Weather icon={currentWeather}/>
            </div>
            
            {/* hourly data list*/}
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
