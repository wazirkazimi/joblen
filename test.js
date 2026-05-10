fetch('http://localhost:5000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobDescription: "Looking for a React dev",
    userProfile: { resumeText: "React Dev" }
  })
}).then(res => res.json()).then(console.log).catch(console.error);
