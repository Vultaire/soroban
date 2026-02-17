<script lang="ts">
    import { onMount } from 'svelte';

    let { problem = $bindable(), showAnswer = $bindable(), selectedLanguage, selectedVoice, selectedRate, onProblemChange, onEnter } = $props();

    let lastProblemValue = null;

    const substitutions = {
        "en-US": {
            "-": "minus",
        },
        "ja-JP": {
            "+": "たす",
            "-": "ひく",
        },
    }

    function onSpeakClicked(phrase: string) {
        if (!selectedVoice) {
            console.error('onSpeakClicked: unexpected unset selected voice')
            return
        }

        let output = tokenize(phrase).map(token => {
            let langSubs = substitutions[selectedLanguage] || {}
            if (token in langSubs) {
                token = langSubs[token]
            }
            return token
        }).join(" ")

        const utterance = new SpeechSynthesisUtterance(output)
        //const utterance = new SpeechSynthesisUtterance(phrase)
        utterance.lang = selectedLanguage ?? "en-US"
        utterance.rate = selectedRate / 100
        utterance.voice = (selectedVoice as SpeechSynthesisVoice)
        window.speechSynthesis.speak(utterance)
    }

    function tokenize(problem: string): string[] {
        /* Very simple: match on numbers (multidigit) and operators (singular).  Commas not (yet) supported. */
        const re = /(\d+|[\+\-])/g
        return Array.from(problem.matchAll(re)).map(match => {
            return match[1]
        })
    }

    function onProblemInnerChange() {
        if (lastProblemValue != problem) {
            //console.log(`Problem change detected: ${lastProblemValue} -> ${problem}`)
            lastProblemValue = problem
            onProblemChange()
        }
    }

    function onkeyup(event) {
        if (event.key == "Enter") {
            onEnter()
        }
    }

    onMount(() => {
        lastProblemValue = problem
    })
</script>

<style>
    input {
        width: 200px;
    }
</style>

<div>
    <input class="problem-simple" bind:value={problem} type="text" oninput={onProblemInnerChange} {onkeyup} />
    {#if selectedVoice}
    <button onclick={() => onSpeakClicked(problem)}>Speak</button>
    {/if}
    <button onclick={() => {showAnswer = !showAnswer}}>{#if showAnswer}Hide{:else}Show{/if} answer</button>
    {#if showAnswer}
    <span class="answer">Answer: {eval(problem)}</span>
    {/if}
</div>
