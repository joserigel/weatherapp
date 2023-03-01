import './Search.css';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Suggestions(props) {
  let navigate = useNavigate();
  function setLocation(index) {
    // Set search params based on the selected search suggestion
    navigate({
      pathname: '/',
      search: new URLSearchParams({
        city: props.search[index]['city'],
        latitude: props.search[index]['latitude'],
        longitude: props.search[index]['longitude'],
      }).toString(),
    });

    // Reloads page to update the location data based on search suggestion
    navigate(0);
  }

  // Initialize list of search suggestion
  let list = [];
  for (let i=0; i<props.search.length; i++) {
    list.push(<li key={i} onClick={() => setLocation(i)}
    >{props.search[i]['city']}, {props.search[i]['country']}</li>)
  }
  return (
    <ul>
      {list}
    </ul>
  )    
}

export default function Search() {
  let [suggestion, setSuggestions] = useState([]);

  // event handler to fetch suggestions based on the text typed on
  // the search bar
  async function changeHandler(e) {
    let s = e.target.value;
    if (s.length > 0) {
      let res = await axios.get('/suggestions', {params: {s: s}});
      setSuggestions(res.data);
    } else {
      setSuggestions([]);
    }
  } 

  let searchSuggestions = <Suggestions search={suggestion}/>
  return(
    <>
      <div className='search-bar'>
        <input type='text' onChange={(e) => changeHandler(e)} placeholder="Search"/>
      </div>
      <div className='suggestions'>
        {searchSuggestions}
      </div>
    </>
  )
}