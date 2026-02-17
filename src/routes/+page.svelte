<script lang="ts">
    import VoiceSelector from '../VoiceSelector.svelte'
    import ProblemSimple from '../ProblemSimple.svelte'

    import { page } from '$app/state'
    import { goto } from '$app/navigation'
    import { tick } from 'svelte'

    class ProblemState {
        problem: string;
        showAnswer: boolean;

        constructor(problem: string) {
            this.problem = $state(problem)
            this.showAnswer = $state(false)
        }
    }

	const problemsFromParam = (page.url.searchParams.get('problems') || "").split(",").map((problemStr) => new ProblemState(problemStr));
    // JS quirk: splitting an empty string gives a list with an empty string, not an empty list.
    // We actually will use this here so we'll always have at least one field;
    // there's no need for us to call addProblem to initialize the first field.

    let title: string = $state(page.url.searchParams.get('title') || "")
    let selectedLanguage: string | undefined = $state()
    let selectedVoice: SpeechSynthesisVoice | undefined = $state()
    let selectedRate: number = $state(100)
    let problems: ProblemState[] = $state(problemsFromParam)
    let allAnswersVisible = false;

    /* Add a problem...  Currently jush pushes empty strings to generate more objects.
       I don't think this really handles state from the children yet, nor am I sure I really need that. */
    function addProblem() {
        problems.push(new ProblemState(""))
    }

    /* Callbacks for the voice selector */
    function onVoiceChanged(voice: SpeechSynthesisVoice) {
        selectedVoice = voice
    }

    function onLanguageChanged(language: string) {
        selectedLanguage = language
    }

    function onRateChanged(rate: number) {
        selectedRate = rate
    }

    function onProblemChange() {
        // Update the URL parameters to match the current problems
        const newURL = page.url
        newURL.searchParams.set('problems', problems.map((problem) => problem.problem).join(','))
        goto(newURL, {keepFocus: true})
    }

    function onProblemEnter(i: number) {
        console.log(`i: ${i}, problem length: ${problems.length}`)
        if (i == problems.length - 1) {
            // We're on the last problem; add a new box for us to move to
            addProblem()
        }
        // Focus on the next problem.
        // This is quick and dirty and likely not the proper svelte way, but it'll work for now.
        // Try to make this cleaner later.
        tick().then(() => {
            document.querySelectorAll('input.problem-simple')[i+1].focus()
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
        const newURL = page.url
        newURL.searchParams.set('title', title)
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
    <title>{title ? title : "Soroban reader"}</title>
</svelte:head>

Title for this page: <input bind:value={title} oninput={onTitleChanged} />
<VoiceSelector {onLanguageChanged} {onVoiceChanged} {onRateChanged} />
<hr />
<p>Input problems one-by-one, using numbers and +/-, e.g. <span class="mono">123+45-67</span>.  (No commas yet.  No multiplication/division yet.)</p>
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
                        selectedLanguage={selectedLanguage}
                        selectedVoice={selectedVoice}
                        selectedRate={selectedRate}
                        {onProblemChange}
                        onEnter={() => {onProblemEnter(i)}}
                        />
                </td>
            </tr>
        {/each}
    </tbody>
</table>
<button onclick={addProblem}>Add problem</button>
<button onclick={showAllAnswers}>{#if allAnswersVisible}Hide{:else}Show{/if} all answers</button>
<button onclick={clearAllProblems}>Clear all problems</button>
<!-- to do (maybe): Add an option to break the playback up into tokens, with an optional delay between the tokens.  (I may need this...  or maybe the rate is enough?) -->