<script>
  import Clock from "./Clock.svelte";
  import Quote from "./Quote.svelte";
  import Todos from "./Todos.svelte";
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
    left: 40%;
    margin-top: 70px;
  }
  .app {
    width: 300px;
    /* justify-content: center; */
    /* left: 50%; */
  }
</style>

<svelte:head>
  <title>Time tracker app</title>
</svelte:head>

<Quote />
<div class="container">
  <div class="app">
    <Clock />
    <Todos />
  </div>
</div>
