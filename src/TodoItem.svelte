<script>
  import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
  import "../node_modules/@fortawesome/fontawesome-free/js/all.min.js";
  import { slide, fade } from "svelte/transition";
  import { currTodo } from "./stores.js";
  import Timer from "./Timer.svelte";
  export let id;
  export let title;

  export let handleDelTodo;
  export let handleUpdateTodo;
  let isFocus = false;

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

  const onDblClick = e => {
    e.target.disabled = false;
    isFocus = true;
    e.target.focus();
  }

  const handleUpdateTodoClick = e => {
    let inputField = document.getElementById("input-" + id);
    inputField.disabled = true;
    isFocus = false;
    handleUpdateTodo(id, inputField.value);
  }
  const handleKeyPress = e => {
    let {key} = e;
    if(key === "Enter") {
       handleUpdateTodoClick(e);
    }
  }
</script>

<style>
  
  .row {
    /* position: absolute; */
    display: flex;
  }
  .title {
    width: 100%;
  }
  /* p {
    text-align: center;
  } */
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
    width: 15%;
    float: left;
    position: relative;
  }

  .row {
    color: black !important;
  }
  input {
    padding: 0%;
    width: 90%;
    margin: 0 10px;
  }

  input:disabled {
    border: 0px;
    color: black;
    background: inherit;
  }
  .btn-update {
    padding-right : 10px;
    cursor: pointer;
  }
</style>

<div class="todo-item" in:slide on:click={updateCurrTodo} on:dblclick={onDblClick}>
  <div class="row">
    <div class="timer">
      {#if currTodoVal === id}
        <Timer {id} />
      {/if}
    </div>
    <div class="title">
      <input disabled value={title} on:keypress={handleKeyPress} id={"input-" + id}/>
    </div>
     {#if isFocus}
      <div class="btn-update" on:click={handleUpdateTodoClick}>
        <i class="fa fa-check" />
      </div>
     {/if}
    <div class="del" on:click={handleDelTodoClick}>
      <i class="fa fa-trash" />
    </div>
  </div>
</div>
