import { useState } from 'react';

function App() {
  const [category, setCategory] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault(); // stops the page from refreshing
    console.log("Logging work:");
    console.log("Category:", category);
    console.log("Hours:", hours);
    console.log("Date:", date);
  };  
    return (
      <div style={{ padding: '2rem' }}>
        <h1>WorkTrak Logger</h1>

        <form onSubmit={handleSubmit}>
          <label>
            Category:
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">--Select--</option>
              <option value="School">School</option>
              <option value="Internship">Internship</option>
              <option value="Projects">Projects</option>
              <option value="Clubs">Clubs</option>
              <option value="Recruiting">Recruiting</option>
            </select>
          </label>

          <br /><br />
          <label>
            Hours:
            <input
              type="number"
              name="hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </label>

        <br /><br />
        
        <label>
          Date:
          <input
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <br /><br />
        <button type="submit">Log Work</button>
      </form>
      {category && <p>Selected category: {category}</p>}
      {hours && <p>Logged hours: {hours}</p>}
      {date && <p>Selected date: {date}</p>}
    </div>
  );  
}
export default App;