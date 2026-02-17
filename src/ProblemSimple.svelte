<script lang="ts">
    import { onMount } from 'svelte';

    let { problem = $bindable(), showAnswer = $bindable(), mode, selectedLanguage, selectedVoice, selectedRate, onProblemChange, onEnter } = $props();

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

    // "Speak all" handler
    function onSpeakClicked(phrase: string) {
        if (!selectedVoice) {
            console.error('onSpeakClicked: unexpected unset selected voice')
            return
        }

        let output = sanitizeForSpeech(phrase)

        const utterance = new SpeechSynthesisUtterance(output)
        //const utterance = new SpeechSynthesisUtterance(phrase)
        utterance.lang = selectedLanguage ?? "en-US"
        utterance.rate = selectedRate / 100
        utterance.voice = (selectedVoice as SpeechSynthesisVoice)
        window.speechSynthesis.speak(utterance)
    }

    function tokenSanitize(problem: string): string[] {
        /* Very simple: match on numbers (multidigit) and operators (singular).  Commas not (yet) supported. */
        const re = /(\d+|[\+\-])/g
        return Array.from(problem.matchAll(re)).map(match => {
            return match[1]
        })
    }

    function sanitizeForSpeech(rawProblem: string): string {
        return substituteTokens(tokenSanitize(rawProblem)).join(" ")
    }

    function sanitize(rawProblem: string): string {
        return tokenSanitize(rawProblem).join(" ")
    }

    function substituteTokens(tokens: string[]): string[] {
        return tokens.map(token => {
            let langSubs = substitutions[selectedLanguage] || {}
            if (token in langSubs) {
                token = langSubs[token]
            }
            return token
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

    function getProblemWithAnswer(problem: string): string {
        const sanitizedProblem = sanitize(problem)
        let answer
        try {
            answer = eval(sanitizedProblem)
        } catch (error) {
            answer = '<eval error>'
        }
        return `${sanitizedProblem} = ${answer}`
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
    {#if mode=="edit"}
    <input class="problem-simple" bind:value={problem} type="text" oninput={onProblemInnerChange} {onkeyup} />
    {:else}
    {#if selectedVoice}
    <button onclick={() => onSpeakClicked(problem)}>Speak</button>
    {/if}
    <button onclick={() => {showAnswer = !showAnswer}}>{#if showAnswer}Hide{:else}Show{/if} answer</button>
    {#if showAnswer}
    <span class="answer">{getProblemWithAnswer(problem)}</span>
    {/if}
    {/if}
</div>
