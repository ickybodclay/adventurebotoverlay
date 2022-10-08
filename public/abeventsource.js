const token =  new URLSearchParams(window.location.search).get('token');
if (!token) throw "Missing token parameter";

const events = new EventSource(
  `https://hular-hoops-bot.glitch.me/adventurebot/events?token=${token}`,
  // { withCredentials: true }
);

events.addEventListener('heartbeat', (event) => {
  const info = JSON.parse(event.data);
  var infoHtml = "";
  if (info.round === "START") {
    infoHtml += "<p>A brand new AI generated adventure is about to begin...</p>";
  } else if (info.round === "PROMPT") {
    infoHtml += "<p>Waiting for prompt from Jason...</p>";
    if (info.winningResponse) {
      infoHtml += `<p>Last AI response (${info.winningResponse.votes} votes):<br>${info.winningResponse.prompt}</p>`;
    }
  } else if (info.round === "GENERATE" || info.round === "VOTE") {
    infoHtml += `<p>Last action: ${info.currentPrompt.prompt}</p>`;
    if (info.botResponses) {
      infoHtml += `<p>Vote for your favorite AI response (ex '!vote 1')</p>`;
      infoHtml += responesesToHtml(info.botResponses, info.votes);
      // const timeRemaining = getTimeRemaing(Date.now(), info.roundStartTime, 1.5);
    } else {
      infoHtml += "<p>Generating...</p>";
    }
  }
  $( "#info" ).html(infoHtml);
});

events.addEventListener('message', (event) => {
  console.log(event);
});

events.addEventListener('open', (event) => {
  console.log("AdventureBot-Overlay> event source client opened");
});

events.addEventListener('error', (err) => {
  console.error("AdventureBot-Overlay> an error occured connecting to event source");
});

/**
 * Convert bot responses to an ordered list (with vote totals, if any)
 */
function responesesToHtml(responses, votes=[]) {
  if (responses.length < 1) return "";

  var listHtml = "<ol>";

  const voteTotals = [];
  for (let i=0; i<responses.length; ++i) {
    voteTotals.push(0);
  }

  for (let i=0; i<votes.length; ++i) {
    voteTotals[votes[i].vote] += 1;
  }

  for (let i=0; i<responses.length; ++i) {
    const voteCount = voteTotals[i];
    if (voteCount > 0) {
      listHtml += `<li id="option${i+1}">${responses[i].prompt} [${voteCount} votes]</li>`;
    } else {
      listHtml += `<li id="option${i+1}">${responses[i].prompt}</li>`;
    }
  }

  listHtml += "</ol>";

  return listHtml;
}

/**
 * Calculate time remaining in round (in seconds)
 */
function getTimeRemaing(currentTime, roundStartTime, roundDurationInMins=1) {
  const roundDurationInMs = (roundDurationInMins*60*1000);
  const roundEnd = roundStartTime + roundDurationInMs;
  const timeRemainingInMs = Math.abs(roundEnd - currentTime);
  if (timeRemainingInMs <= 0 || timeRemainingInMs > roundDurationInMs) return 0;
  return Math.round(Math.max(0, timeRemainingInMs / 1000));
}