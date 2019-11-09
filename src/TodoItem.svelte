<script>
  import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
  import "../node_modules/@fortawesome/fontawesome-free/js/all.min.js";
  import { slide, fade } from "svelte/transition";
  import { currTodo } from "./stores.js";
  import Timer from "./Timer.svelte";
  export let id;
  export let title;

  export let handleDelTodo;
  let currTodoVal;
  const handleDelTodoClick = e => {
    handleDelTodo(id);
  };

  const updateCurrTodo = e => {
    currTodo.update(oldId => id);
  };

  const unsubscribe = currTodo.subscribe(todoID => {
    currTodoVal = todoID;
  });
</script>

<style>
  
  .row {
    /* position: absolute; */
    display: flex;
  }
  .title {
    width: 60%;
  }
  p {
    text-align: center;
  }
  .todo-item {
    padding: 10px 0px;
    border-bottom: 1px solid black !important;
  }
  .todo-item:hover .del {
    display: block;
  }
  .todo-item .del {
    display: none;
  }
  .del {
    width: 10%;
    position: relative;
    float: right;
    cursor: pointer;
  }
  .timer {
    width: 30%;
    float: left;
    position: relative;
  }

  .row {
    color: black !important;
  }
</style>

<div class="todo-item" in:slide on:click={updateCurrTodo}>
  <div class="row">
    <div class="timer">
      {#if currTodoVal === id}
        <Timer {id} />
      {/if}
    </div>
    <div class="title">
      <p>{title}</p>
    </div>
    <div class="del" on:click={handleDelTodoClick}>
      <i class="fa fa-trash" />
    </div>
  </div>
</div>
