<script>
  import Clock from "./Clock.svelte";
  import Quote from "./Quote.svelte";
  import Todos from "./Todos.svelte";
  import Setting from "./Setting.svelte";
  import { darkmode } from "./stores.js";

 const unsubscribe = darkmode.subscribe(isDarkmode => {
    const body = document.getElementsByTagName("body")[0];
    const colDarkGrey = "#1f1f1f";
    const colWhiteGrey = "#f5f5f5";

    
    if(isDarkmode) {
      body.style.backgroundColor = colDarkGrey;
      body.style.color = colWhiteGrey;
    } else {
      body.style.backgroundColor = colWhiteGrey;
      body.style.color = colDarkGrey;
    }
  });

</script>

<style>
  :global(body) {
    margin: 0%;
    padding: 0%;
    overflow: hidden;
  }

  :global(p) {
    margin: 0%;
    padding: 0%;
  }
  .container {
    position: absolute;
    left: 30%;
    margin-top: 70px;
  }
  .app {
    width: 500px;
  }

</style>

<svelte:head>
  <title>Time tracker app</title>
</svelte:head>

<div class="body">
  <Quote />
  <div class="container">
    <div class="app">
      <Clock />
      <Todos />
    </div>
  </div>
  <Setting />
</div>