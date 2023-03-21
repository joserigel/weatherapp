import './Search.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';


function Suggestions(props) {
  let navigate = useNavigate();
  function setLocation(index) {
    // Set search params based on the selected search suggestion
    navigate({
      pathname: '/',
      search: new URLSearchParams({
        city: props.search[index][2],
        latitude: props.search[index][3],
        longitude: props.search[index][4],
      }).toString(),
    });

    // Reloads page to update the location data based on search suggestion
    navigate(0);
  }

  // Initialize list of search suggestion
  let list = [];
  for (let i=0; i<props.search.length; i++) {
    list.push(<li key={i} onClick={() => setLocation(i)}
    >{props.search[i][2]}, {props.search[i][1]}</li>)
  }
  return (
    <ul>
      {list}
    </ul>
  )    
}

export default function Search() {
  const [suggestion, setSuggestions] = useState([]);
  const [data, setData] = useState(null); 

  useEffect(() => {
    // This is parsing the csv file
    Papa.parse('./World_Cities_Location_table.csv', {
      header: false,
      download: true,
      complete: (result) => {
        setData(result.data);
      }
    });
  }, []);
  
  // event handler to fetch suggestions based on the text typed on
  // the search bar
  function changeHandler(e) {
    let s = e.target.value.toLowerCase();
    
    let list = [];
    if (data !== null && s !== null && s.length !== 0) {
      // Go through the entire csv file to check if any row contains the city specified by the search bar
      // Unfortunately due to loading it might cause a lag spike
      for (let i=0; i<data.length; i++) {
        try {
          let row = data[i];
          if (row !== null && row.length >= 3) {
            // Check if the row[2] which is the city column, to see if it includes the search word
            if (row[2].toLowerCase().includes(s)) {
              list.push(row);
              if (list.length >= 5) {
                break;
              }
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
      setSuggestions(list);
    } else {
      setSuggestions([]);
    }
  }

  return(
    <>
      <div className='search-bar'>
        <input type='text' onChange={(e) => changeHandler(e)} placeholder="Search"/>
      </div>
      <div className='suggestions'>
      <Suggestions search={suggestion}/>
      </div>
    </>
  )
}
