<script>
  export let start = new Date();
  export let end = new Date();

  export let id = "";
  end.setMinutes(end.getMinutes() + 500);
  let time = "";

  console.log("TIMER INSTANCE CREATED");
  let intervalID = setInterval(() => {
    start = new Date();
    time = end - start;
    // time = new Date(time);
    let sec = Math.round((time / 1000) % 60) % 60;
    let min = Math.round(time / (60 * 1000)) % 60;
    let hour = Math.round(time / (60 * 60 * 1000));

    console.log("TIMER RUNNING", id);
    time = `${hour}:${min}:${sec}`;

    let isVisible = document.getElementById(id) !== null;
    if (!isVisible) endTimer();
  }, 1000);

  function endTimer() {
    clearInterval(intervalID);
  }
</script>

<style>
  p {
    margin: 0px 10px;
  }
</style>

<p {id}>{time}</p>
