<script>
  import TodoItem from "./TodoItem.svelte";
  import TodoAdd from "./TodoAdd.svelte";
  // export let todos;
  // export let handleDelTodo;
  import { todos, currTodo } from "./stores.js";

  let todosVal = [];

  const unsubscribe = todos.subscribe(todos => {
    todosVal = todos;
    localStorage.setItem("todos" ,JSON.stringify(todos));
  });
  let handleDelTodo = id => {
    todos.update(todosVal => [...todosVal.filter(el => el.id !== id)]);
  };
</script>

<style>
  .todo-item {
    background-color: #f1f1f1;
  }
  .todo-list {
    overflow-y: auto;
    height: 300px;
    padding: 3px;
  }
  .title {
    text-align: right;
  }
</style>

<TodoAdd />

<div class="todos">
  {#if todosVal.length}
    <div class="title">Todo left : {todosVal.length}</div>
    <div class="todo-list">
      {#each todosVal as todo}
        <div class="todo-item">
          <TodoItem {...todo} {handleDelTodo} />
        </div>
      {/each}
    </div>
  {:else}
    <div style="text-align: center;">Awesome no todo left! great work:)</div>
  {/if}
</div>
