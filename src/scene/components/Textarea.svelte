<script>
  export let id = null
  export let value = null
  export let rows = 2
  export let name = null
  export let disabled = false
  export let readonly = false
  export let selectOnFocus = false
  export let placeholder = 'Input something here...'
  export { className as class }

  let className = ''
  let textarea
</script>

<div class="textarea {className}">
  <textarea
    type="input"
    on:change
    on:focus={() => {
      if (selectOnFocus) textarea.select()
    }}
    bind:this={textarea}
    bind:value
    {id}
    {name}
    {rows}
    {disabled}
    {readonly}
    {placeholder}
  />
</div>

<style>
  .textarea {
    position: relative;
  }

  textarea {
    font-size: var(--font-size-xsmall);
    font-weight: var(--font-weight-normal);
    letter-spacing: var(--font-letter-spacing-neg-xsmall);
    line-height: var(--line-height);
    position: relative;
    display: flex;
    overflow: visible;
    align-items: center;
    width: 100%;
    min-height: 62px;
    margin: 1px 0 1px 0;
    padding: 7px 4px 9px 7px;
    color: var(--black8);
    border: 1px solid var(--black1);
    border-radius: var(--border-radius-small);
    outline: none;
    background-color: var(--white);
    resize: none;
    overflow-y: auto;
  }
  textarea:hover,
  textarea:placeholder-shown:hover {
    color: var(--black8);
    border: 1px solid var(--black1);
    background-image: none;
  }
  textarea::selection {
    color: var(--black);
    background-color: var(--blue3);
  }
  textarea::placeholder {
    color: var(--black3);
    border: 1px solid transparent;
  }
  textarea:focus:placeholder-shown {
    border: 1px solid var(--blue);
    outline: 1px solid var(--blue);
    outline-offset: -2px;
  }
  textarea:active,
  textarea:focus {
    padding: 7px 4px 9px 7px;

    color: var(--black);
    border: 1px solid var(--blue);
    outline: 1px solid var(--blue);
    outline-offset: -2px;
  }
  textarea:disabled,
  textarea:disabled:hover {
    position: relative;
    color: var(--black3);
    border: 1px solid transparent;
  }
  textarea:disabled:active {
    padding: 7px 4px 9px 7px;
    outline: none;
  }
</style>
