<script>
  import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
  import "../node_modules/@fortawesome/fontawesome-free/js/all.min.js";
  export let id;
  export let title;

  export let handleDelTodo;
  const handleDelTodoClick = e => {
    handleDelTodo(id);
  };
</script>

<style>
  .row {
    /* position: absolute; */
    display: flex;
  }
  .title {
    width: 90%;
  }
  p {
    text-align: center;
    margin: 0px;
  }
  .todo-item {
    padding: 10px 0px;
    border-bottom: 1px solid;
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
</style>

<div class="todo-item">
  <div class="row">
    <div class="title">
      <p>{title}</p>
    </div>
    <div class="del" on:click={handleDelTodoClick}>
      <i class="fa fa-trash" />
    </div>
  </div>
</div>
