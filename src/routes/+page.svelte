<script lang="ts">
    import VoiceSelector from '../lib/components/VoiceSelector.svelte'
    import ProblemSimple from '../lib/components/ProblemSimple.svelte'

    import { page } from '$app/state'
    import { goto } from '$app/navigation'
    import { tick } from 'svelte'

    import { ProblemState } from '../lib/classes/ProblemState.svelte'

	const problemsFromParam = (page.url.searchParams.get('problems') || "").split(",").map((problemStr) => new ProblemState(problemStr));
    // JS quirk: splitting an empty string gives a list with an empty string, not an empty list.
    // We actually will use this here so we'll always have at least one field;
    // there's no need for us to call addProblem to initialize the first field.

    let title: string = $state(page.url.searchParams.get('title') || "")
    let selectedLanguage: string | undefined = $state(page.url.searchParams.get('language') || 'en-US')
    let selectedVoice: SpeechSynthesisVoice | undefined = $state()
    let selectedRate: number = $state(100)
    let problems: ProblemState[] = $state(problemsFromParam)

    let modeParam = page.url.searchParams.get('mode')
    if (modeParam != 'edit' && modeParam != 'practice') {
        modeParam = 'edit'
    }
    let viewMode: string = $state(modeParam)

    const ALL_AT_ONCE = 'all-at-once'
    const BY_NUMBER = 'by-number'

    let speechModeParam = page.url.searchParams.get('speechMode')
    if (speechModeParam != ALL_AT_ONCE && speechModeParam != BY_NUMBER) {
        speechModeParam = BY_NUMBER
    }
    let speechMode: string = $state(speechModeParam)
    let speakByPart: boolean = $derived(speechMode == BY_NUMBER)

    let allAnswersVisible: boolean = $state(false);

    let ja: boolean = $derived(selectedLanguage == 'ja-JP')
    // For Japanese display: allow for displaying with and without kanji (the latter being more kid friendly)
    let kanji: boolean = $state(true)

    let debug: boolean = $state(page.url.searchParams.get('debug') == "true" || false)

    /* Add a problem...  Currently jush pushes empty strings to generate more objects.
       I don't think this really handles state from the children yet, nor am I sure I really need that. */
    function addProblem() {
        problems.push(new ProblemState(""))
    }

    /* Callbacks for the voice selector */
    function onVoiceChanged(voice: SpeechSynthesisVoice) {
        selectedVoice = voice
    }

    function onSpeechModeChanged() {
        speechMode = (speechMode == BY_NUMBER ? ALL_AT_ONCE : BY_NUMBER)
        updateUrlParam('speechMode', speechMode)
    }

    function onLanguageChanged() {
        //selectedLanguage = language  // No longer needed here; two-way binding handles this part at least.
        // Update the URL parameters to match the current problems
        if (typeof selectedLanguage === 'string') {
            updateUrlParam('language', selectedLanguage)
        }
    }

    function onRateChanged(rate: number) {
        selectedRate = rate
    }

    function onViewModeChange() {
        // Update the URL parameters to match the current problems
        updateUrlParam('mode', viewMode)
    }

    function onProblemChange() {
        // Update the URL parameters to match the current problems
        updateUrlParam('problems', problems.map((problem) => problem.problem).join(','))
    }

    function onProblemEnter(i: number) {
        if (i == problems.length - 1) {
            // We're on the last problem; add a new box for us to move to
            addProblem()
        }
        // Focus on the next problem.
        // This is quick and dirty and likely not the proper svelte way, but it'll work for now.
        // Try to make this cleaner later.
        tick().then(() => {
            const elements: NodeListOf<HTMLElement> = document.querySelectorAll('input.problem-simple')
            elements[i+1].focus()
        })
    }

    function clearAllProblems() {
        // Reset problems to a single empty item.
        if (confirm("Are you sure you wish to clear all problems?")) {
            problems = [new ProblemState("")];
            onProblemChange()
        }
    }

    function onTitleChanged() {
        // Update the URL parameters to match the current title
        updateUrlParam('title', title)
    }

    function updateUrlParam(field: string, value: string) {
        const newURL = page.url
        newURL.searchParams.set(field, value)
        goto(newURL, {keepFocus: true})
    }

    function showAllAnswers() {
        allAnswersVisible = !allAnswersVisible
        problems.forEach(problem => problem.showAnswer = allAnswersVisible)
    }

</script>

<style>
    span.mono {
        font-family: monospace;
        background-color: #CCCCCC;
    }
    table {
        border-spacing: 0px 1em;
    }
</style>

<svelte:head>
    <title>{title ? title : (ja ? "そろばん：よみあげざんツール" : "Soroban reader")}</title>
</svelte:head>

{#if ja}ページのタイトル：{:else}Title for this page: {/if}<input bind:value={title} autocomplete="off" oninput={onTitleChanged} />
<VoiceSelector bind:selectedLanguage bind:kanji {onLanguageChanged} {onVoiceChanged} {onRateChanged} {speakByPart} {onSpeechModeChanged} />
<hr />
<input type="radio" name="mode" bind:group={viewMode} id="edit" value="edit" autocomplete="off" onchange={onViewModeChange} /><label for="edit">{#if ja && kanji}編集モード{:else if ja}へんしゅうモード{:else}Edit mode{/if}</label>
<input type="radio" name="mode" bind:group={viewMode} id="practice" value="practice" autocomplete="off" onchange={onViewModeChange} /><label for="practice">{#if ja && kanji}練習モード{:else if ja}れんしゅうモード{:else}Practice mode{/if}</label>
{#if viewMode == 'edit'}
  {#if ja && kanji}
  <p>問題を一個ずつ記入してください。半角の数字、「+」、「-」、「*」、「/」は大丈夫です。例えば：<span class="mono">123+45-67</span>。()を使えません。計算は簡単の「左から右順」です。</p>
  {:else if ja}
  <p>もんだいをいっこずつきにゅうしてください。はんかくのすうじ、「+」、「-」、「*」、「/」はだいじょうぶです。たとえば：<span class="mono">123+45-67</span>。()をつかえません。けいさんはかんたんの「ひだりからみぎじゅん」です。</p>
  {:else}
  <p>Input problems one-by-one, using numbers and +-*/ characters, e.g. <span class="mono">123+45-67</span>.  (No commas, no parenthesis.  Note that solutions are calculated in simple left-to-right order.)</p>
  {/if}
{:else}
  {#if ja && kanji}
  <p>問題を再生して、回答して（そろばんでも、暗算でも）、そして答えを確認してください。</p>
  {:else if ja}
  <p>もんだいをさいせいして、かいとうして（そろばんでも、あんざんでも）、そしてこたえをかくにんしてください。</p>
  {:else}
  <p>Play back the problems, solve them (soroban or anzan), then check your answers.</p>
  {/if}
{/if}
<!-- being lazy; not wanting to remember CSS grid layout stuff tonight -->
<table>
    <tbody>
        {#each problems as problem, i}
            <tr>
                <td>{i+1}. </td>
                <td>
                    <ProblemSimple
                        bind:problem={problems[i].problem}
                        bind:showAnswer={problems[i].showAnswer}
                        {selectedLanguage}
                        {kanji}
                        {selectedVoice}
                        {selectedRate}
                        {viewMode}
                        {speechMode}
                        {debug}
                        {onProblemChange}
                        onEnter={() => {onProblemEnter(i)}}
                        />
                </td>
            </tr>
        {/each}
    </tbody>
</table>
{#if viewMode == 'edit'}
<button onclick={addProblem}>{#if ja && kanji}問題を追加する{:else if ja}もんだいをついかする{:else}Add problem{/if}</button>
<button onclick={clearAllProblems}>{#if ja && kanji}問題を全部消す{:else if ja}もんだいをぜんぶけす{:else}Clear all problems{/if}</button>
{:else}
<button onclick={showAllAnswers}>{#if ja && kanji}答えを全部{#if allAnswersVisible}隠す{:else}見せる{/if}{:else if ja}こたえをぜんぶ{#if allAnswersVisible}かくす{:else}みせる{/if}{:else}{#if allAnswersVisible}Hide{:else}Show{/if} all answers{/if}</button>
{/if}
<!-- to do (maybe): Add an option to break the playback up into tokens, with an optional delay between the tokens.  (I may need this...  or maybe the rate is enough?) -->