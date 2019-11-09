<script>
  let timeStr = "";
  setInterval(() => {
    timeStr = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata"
    });
  }, 1000);
</script>

<style>
  h1 {
    font-size: 2em;
    text-align: center;
  }
  h1 span {
    color: crimson;

    animation: blinker 1s linear infinite;
  }

  @keyframes blinker {
    100% {
      opacity: 0;
    }
  }
</style>

<h1>
  TIME:
  <span>{timeStr}</span>
</h1>
