import React from 'react';

export default function CalorieGoalCard({ caloriesConsumedToday, dailyCalories, profileData, onOpenProfile }) {
  const remaining = dailyCalories - caloriesConsumedToday;
  const percentage = Math.min((caloriesConsumedToday / dailyCalories) * 100, 100);

  const status = percentage < 80 ? 'green' : percentage < 100 ? 'yellow' : 'red';

  return (
    <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>Daily Calorie Goal</div>
          <div style={{ fontSize: 24, fontWeight: '700' }}>{dailyCalories?.toLocaleString()} cal</div>
        </div>
        <div>
          <button onClick={onOpenProfile}>Set Profile</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{caloriesConsumedToday}</div>
            <div style={{ fontSize: 12, color: '#666' }}>consumed</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{remaining}</div>
            <div style={{ fontSize: 12, color: '#666' }}>remaining</div>
          </div>
        </div>

        <div style={{ marginTop: 8, height: 10, background: '#f3f4f6', borderRadius: 6 }}>
          <div style={{ width: `${percentage}%`, height: '100%', background: status === 'green' ? '#10b981' : status === 'yellow' ? '#f59e0b' : '#ef4444', borderRadius: 6 }} />
        </div>
      </div>

      {profileData && (
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Height</div>
            <div style={{ fontWeight: '600' }}>{Math.floor((profileData.height_in || 0) / 12)}'{Math.round((profileData.height_in || 0) % 12)}"</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Weight</div>
            <div style={{ fontWeight: '600' }}>{profileData.weight_lb} lb</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Activity</div>
            <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{profileData.activity_level}</div>
          </div>
        </div>
      )}
    </div>
  );
}
