import './Search.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Suggestions(props) {
  let navigate = useNavigate();
  function setLocation(index) {
    // Set search params based on the selected search suggestion
    navigate({
      pathname: '/',
      search: new URLSearchParams({
        city: props.search[index]['display_name'].split(',')[0],
        latitude: props.search[index]['boundingbox'][0],
        longitude: props.search[index]['boundingbox'][2],
      }).toString(),
    });

    // Reloads page to update the location data based on search suggestion
    navigate(0);
  }

  // Initialize list of search suggestion
  let list = [];
  for (let i=0; i<Math.min(props.search.length, 5); i++) {
    list.push(<li key={i} onClick={() => setLocation(i)}
    >{props.search[i]['display_name']}</li>)
  }
  return (
    <ul>
      {list}
    </ul>
  )    
}

export default function Search() {
  const [fetched, setFetched] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Timer to fetch search locations using
    // geocode forward api
    const timer = setInterval(() => {
      if (!fetched && search.length > 0) {
        
        setFetched(true);
        axios.get("https://geocode.maps.co/search", {
          params: {
            q: search
          }
        }).then((res) => {
          setSuggestions(res.data);
        });
      }
    }, 505);

    return () => clearInterval(timer);
  }, [search, fetched]);
  
  // event handler to fetch suggestions based on the text typed on
  // the search bar
  function changeHandler(e) {
    let s = e.target.value.toLowerCase();
    if (s !== null && s.length > 0) {
      setFetched(false);
      setSearch(s);
    } else {
      setSuggestions([]);
      setSearch('');
    }
  }

  return(
    <>
      <div className='search-bar'>
        <input type='text' onChange={(e) => changeHandler(e)} placeholder="Search"/>
      </div>
      <div className='suggestions'>
      <Suggestions search={suggestions}/>
      </div>
    </>
  )
}
