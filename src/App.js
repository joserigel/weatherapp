import './App.css';
import React from 'react';
import { createRef, forwardRef, useState } from 'react';
import { keyframes } from 'styled-components';
import { useEffect } from 'react';
import styled from 'styled-components';


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
      <div>
        {props.time}
      </div>
    </li>
  );
}


function Temperature(props) {
  let prevTemp  = Math.round(props.prevTemp);
  let wipeFrom = (Math.min(Math.max(prevTemp, -35), 35) + 35) / 70;
  let temp = Math.round(props.temperature);
  let wipeTo = (Math.min(Math.max(temp, -35), 35) + 35) / 70;

  return (
    <div>
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

  updateIdx(idx) {
    if (this.state.data != null) {
      this.setState({ 
        prevTemp: this.state.data.hourly.temperature_2m[this.state.selectedIdx]
      });
      this.setState({
        selectedIdx: idx
      })
      console.log(this.state.prevTemp + "," + this.state.selectedIdx)
    } else {
      this.setState({
        prevTemp: 45,
        selectedIdx: idx
      })
    }
  }
  update(date) {
    try {
      let currentTime = date.toISOString().substring(0, 14) + "00";
      fetch('https://api.open-meteo.com/v1/forecast?' 
        + new URLSearchParams({
          latitude:52.52,
          longitude: 13.41,
          start_date: currentTime.substring(0, 10),
          end_date: currentTime.substring(0, 10)
        }) 
        + '&hourly=temperature_2m,weathercode'
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

    let dateString = `${days[this.state.date.getDay()]}, ${this.state.date.getDate()} ${months[this.state.date.getMonth() - 1]} ${this.state.date.getFullYear()}`;
    
    let cells = []
    if (this.state.data != null) {
      for (let i=0; i<24; i++) {
        cells.push(<Cell 
          key={i}
          selected={(this.state.selectedIdx === i)} 
          time={this.state.data.hourly.time[i].substring(11, 16)}
          onclick={() => this.updateIdx(i)}
        />);
      }
    }

    return(
      <>
        <h1>{this.state.location}</h1>
        <div className='card center'>
          <div className='date'>
            <div className='button'>
              <img src='./arrow_back.svg' style={{transform: 'translateX(15%)'}}/>
            </div>
            <div className='date-text'><h2>{dateString}</h2></div>
            <div className='button'>
              <img src='./arrow_forward.svg'/>
            </div>
          </div>
          
          <main>
            <Temperature 
              prevTemp={this.state.prevTemp}
              temperature={(this.state.data === null)? 0 : this.state.data.hourly.temperature_2m[this.state.selectedIdx]}
              unit={(this.state.data === null)? "°C" : this.state.data.hourly_units.temperature_2m}
            />
            <ul>
              {cells}
            </ul>
          </main>
            
        </div>
      </>
    );
  }
}

/*function App() {
  let [temperature, setTemperature] = useState(0);
  let [date, setDate] = useState("");
  let [location, setLocation] = useState('Berlin');
  let [unit, setUnit] = useState('°C');
  let [data, setData] = useState(null);
  let [hourly, setHourly] = useState([]);

  let currentTime = new Date().toISOString().substring(0, 14) + "00";

  useEffect(() => {

    // Fetching from API
    try {
      fetch('https://api.open-meteo.com/v1/forecast?' 
        + new URLSearchParams({
          latitude:52.52,
          longitude: 13.41,
          start_date: currentTime.substring(0, 10),
          end_date: currentTime.substring(0, 10)
        }) 
        + '&hourly=temperature_2m,weathercode'
      ).then((res) => res.json()).then((raw) => {
        setData(raw.hourly);
        let times = raw.hourly.time;
        let idx = 0;


        let list = [];
        for (let i=0; i<times.length; i++) {
          let temp = 0;
          if (data != null) {
            temp = data.temperature_2m[i];
          }
          if (times[i] === currentTime) {
            idx = i;
            list.push(<Cell key={i} selected={true} temperature={temp}
              time={times[i].substring(11, times[i].length)}/>);
          } else {
            list.push(<Cell key={i} selected={false} temperature={temp}
              time={times[i].substring(11, times[i].length)}/>);
          }
        }
        setHourly(list);
        let temp = Math.round(raw.hourly.temperature_2m[idx]);
        setTemperature(temp);
        setUnit(raw.hourly_units.temperature_2m);

      });
    } catch (e) {
      console.log(e);
    }


    let currentDate = new Date();
    let dateString = "";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["null", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    dateString += `${days[currentDate.getDay()]}, ${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    setDate(dateString);
  });

  return (
    <>
      <h1>{location}</h1>
      <div className='card center'>
        <div className='date'>
          <div className='button'>
            <img src='./arrow_back.svg' style={{transform: 'translateX(15%)'}}/>
          </div>
          <div className='date-text'><h2>{date}</h2></div>
          <div className='button'>
            <img src='./arrow_forward.svg'/>
          </div>
        </div>
        
        <main>
          <Temperature temperature={temperature} unit={unit}/>
          <ul>
            {hourly}
          </ul>
        </main>
          
      </div>
    </>
  );
}*/

export default App;
