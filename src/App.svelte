<script>
  import Clock from "./Clock.svelte";
  import Quote from "./Quote.svelte";
  import TodoAdd from "./TodoAdd.svelte";
  import Todos from "./Todos.svelte";
  import { todos } from "./stores.js";

  let todosVal = [];
  let maxImage = 8;

  const unsubscribe = todos.subscribe(todos => {
    todosVal = todos;
  });
  let handleDelTodo = id => {
    todos.update(todosVal => [...todosVal.filter(el => el.id !== id)]);
  };
  let imageCSS = `"url(/image/${Math.round(Math.random() * 8)}.jpg)"`;
  console.log(imageCSS);
  // document.onreadystatechange(() => {
  setTimeout(() => {
    document.getElementsByTagName("body")[0].style.backgroundImage = imageCSS;
    // });o
  }, 5000);
</script>

<style>
  :global(body) {
    margin: 0%;
    padding: 0%;
    overflow: hidden;
    /* background-image: url("/image/2.jpg"); */
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .overlay {
    /* color: rgba(209, 206, 209, 1); */
    background: rgba(255, 255, 255, 0.4);
    width: 100%;
    height: 100%;
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
  }
</style>

<div class="overlay">
  <Quote />
  <div class="container">
    <div class="app">
      <Clock />
      <TodoAdd />

      <Todos todos={todosVal} {handleDelTodo} />
      \
    </div>
  </div>
</div>
