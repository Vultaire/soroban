<script lang="ts">
    import { onMount } from 'svelte';

    let { problem = $bindable(), showAnswer = $bindable(), mode, selectedLanguage, kanji, selectedVoice, selectedRate, debug, onProblemChange, onEnter } = $props();

    let lastProblemValue = null;

    let ja: boolean = $derived(selectedLanguage == 'ja-JP')

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
    function onListenClicked(phrase: string) {
        if (!selectedVoice) {
            console.error('onListenClicked: unexpected unset selected voice')
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
            answer = '<error>'
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
        <input class="problem-simple" bind:value={problem} type="text" autocomplete="off" oninput={onProblemInnerChange} {onkeyup} />
    {:else}
        {#if selectedVoice}
        <button onclick={() => onListenClicked(problem)}>{#if ja && kanji}聞く{:else if ja}きく{:else}Listen{/if}</button>
        {/if}
        <button onclick={() => {showAnswer = !showAnswer}}>{#if ja && kanji}答えを{#if showAnswer}隠す{:else}見せる{/if}{:else if ja}こたえを{#if showAnswer}かくす{:else}みせる{/if}{:else}{#if showAnswer}Hide{:else}Show{/if} answer{/if}</button>
        {#if showAnswer}
        <span class="answer">{getProblemWithAnswer(problem)}</span>
        {/if}
    {/if}
    {#if debug}<span class="debug">Spoken: {sanitizeForSpeech(problem)}</span>{/if}
</div>
