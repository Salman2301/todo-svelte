<script>
  let url = "https://api.quotable.io/random";
  let quote;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      quote = data;
    });
</script>

<style>
  p span {
    float: right;
    font-style: italic;
    color: darkgray;
  }
  p {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    /* top: 40px; */
    padding: 10px 40px;
    margin: 0px;
    text-align: center;
    font: 1.5em;
    font-weight: bold;
  }
</style>

{#if quote != undefined}
  <p>
    {quote.content}
    <span>- {quote.author}</span>
  </p>
{/if}
