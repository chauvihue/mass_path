import React, { useEffect, useState } from 'react';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'lightly active', label: 'Lightly Active', description: 'Exercise 1-3 days/week' },
  { value: 'moderately active', label: 'Moderately Active', description: 'Exercise 3-5 days/week' },
  { value: 'active', label: 'Active', description: 'Exercise 6-7 days/week' },
  { value: 'very active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
];

export default function PersonalInfoForm({ userId, onSaved, profileData, dailyCalories, loading, error, saveProfile }) {

  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInches, setHeightInches] = useState(8);
  const [weight, setWeight] = useState(150);
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(25);
  const [activityLevel, setActivityLevel] = useState('moderately active');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (profileData) {
      const total = profileData.height_in || 0;
      setHeightFeet(Math.floor(total / 12));
      setHeightInches(Math.round(total % 12));
      setWeight(profileData.weight_lb || 150);
      setGender(profileData.gender || 'male');
      setAge(profileData.age || 25);
      setActivityLevel(profileData.activity_level || 'moderately active');
    }
  }, [profileData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Raw form values:', { heightFeet, heightInches, weight, gender, age, activityLevel });
    
    const totalHeight = (parseInt(heightFeet || 0) * 12) + parseInt(heightInches || 0);
    const payload = {
      height_in: totalHeight,
      weight_lb: parseFloat(weight),
      gender,
      age: parseInt(age, 10),
      activity_level: activityLevel
    };
    
    console.log('Sending payload to API:', payload);
    try {
      const result = await saveProfile(payload);
      setSavedMsg(`Saved — daily target ${result.daily_calories} cal`);
      if (onSaved) onSaved(payload, result.daily_calories);
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  return (
    <div className="personal-info-form" style={{ padding: 12 }}>
      <h3>Personal Information</h3>
      {savedMsg && <div style={{ color: 'green' }}>{savedMsg}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label>Feet</label>
            <input type="number" min="3" max="8" value={heightFeet} onChange={(e) => setHeightFeet(parseInt(e.target.value) || 0)} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Inches</label>
            <input type="number" min="0" max="11" value={heightInches} onChange={(e) => setHeightInches(parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <label>Weight (lbs)</label>
          <input type="number" min="50" max="500" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>

        <div>
          <label>Gender</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setGender('male')} style={{ background: gender === 'male' ? '#ddd' : 'transparent' }}>Male</button>
            <button type="button" onClick={() => setGender('female')} style={{ background: gender === 'female' ? '#ddd' : 'transparent' }}>Female</button>
          </div>
        </div>

        <div>
          <label>Age</label>
          <input type="number" min="13" max="120" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 13)} />
        </div>

        <div>
          <label>Activity Level</label>
          <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
            {ACTIVITY_LEVELS.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </form>
    </div>
  );
}
