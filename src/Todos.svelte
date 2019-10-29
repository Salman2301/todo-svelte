<script>
  import TodoItem from "./TodoItem.svelte";
  export let todos;
  export let handleDelTodo;
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

<div class="todos">
  {#if todos.length}
    <div class="title">Todo left : {todos.length}</div>
    <div class="todo-list">
      {#each todos as todo}
        <div class="todo-item">
          <TodoItem {...todo} {handleDelTodo} />
        </div>
      {/each}
    </div>
  {:else}
    <div style="text-align: center;">Awesome no todo left! great work:)</div>
  {/if}
</div>
