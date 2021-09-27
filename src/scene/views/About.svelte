<script lang="ts">
  import Header from '../components/Header.svelte'
  import SquareButton from '../components/SquareButton.svelte'

  import IconAtlasLogo from '../icons/atlas-logo.svg'
  import IconPlay from '../icons/play.svg'
  import IconWels from '../icons/wels-text.svg'
</script>

<section class="scroll-box">
  <div class="iconwrapper">{@html IconAtlasLogo}</div>
  <hr />
  <Header title="Support" />
  <div class="rowBox flexSection flexGrow support">
    <p class="sectionBox smallSidePadding">Are you having problems with Atlas, think there is a bug or do you have feedback?</p>
    <p class="sectionBox smallSidePadding">Reach out on <a href="https://twitter.com/JulianWels" target="_blank">twitter.com/JulianWels</a></p>
    <p class="sectionBox smallSidePadding">File an issue on <a href="https://github.com/JulianWels/atlas" target="_blank">github.com/JulianWels/atlas</a></p>
    <p class="sectionBox smallSidePadding">Send a mail to <strong class="selectable">help@jwels.berlin</strong></p>
  </div>
  <hr class="spacer" />
  <Header title="Tutorials" />
  <div class="flexSection flexGrow tutorials">
    <a href="https://www.youtube.com/watch?v=LjDorKkKdTI" target="_blank" class="singleItem">
      <span class="label">Creating and applying themes</span>
      {@html IconPlay}
    </a>
    <a href="https://www.youtube.com/watch?v=C6FSgz5g170" target="_blank" class="singleItem">
      <span class="label">Managing and editing themes</span>
      {@html IconPlay}
    </a>
    <a href="https://www.youtube.com/watch?v=Cg6M17yslNs" target="_blank" class="singleItem">
      <span class="label">Using theme groups</span>
      {@html IconPlay}
    </a>
    <a href="https://www.youtube.com/watch?v=-7e6dux-npY" target="_blank" class="singleItem">
      <span class="label">Atlas and design systems</span>
      {@html IconPlay}
    </a>
    <a href="https://www.youtube.com/watch?v=-7e6dux-npY&t=53" target="_blank" class="singleItem">
      <span class="label">Exporting themes to other files</span>
      {@html IconPlay}
    </a>
  </div>
  <hr class="spacer" />
  <a href="https://jwels.berlin/" target="_blank" class="made-by">Made by {@html IconWels} in Berlin</a>
</section>

<style lang="stylus">
section
  flex-grow 1
  hr
    margin var(--size-xxsmall) 0
.iconwrapper
  text-align center
  margin var(--size-medium)
.tutorials > a
  color inherit
  &:hover
      background-color var(--hover-fill)
      text-decoration inherit
  &:focus
    outline none
    border-color var(--blue)
    box-shadow inset 0 0 0 1px var(--blue)
.made-by
  color inherit
  display block
  text-align center
  font-size var(--font-size-small)
  padding var(--size-xsmall)

</style>
