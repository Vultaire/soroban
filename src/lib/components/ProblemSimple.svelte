<script lang="ts">
    import { onMount } from 'svelte';

    const substitutions = {
        "en-US": {
            "-": "minus",
            "*": "multiplied by",
            "/": "divided by",
        },
        "ja-JP": {
            "+": "たす",
            "-": "ひく",
            "*": "かける",
            "/": "わる",
        },
    }

    const validTokensRgx = /(\d+|[\+\-\*\/])/g
    const digitRgx = /^\d+$/

    let { problem = $bindable(), showAnswer = $bindable(), viewMode, speechMode, selectedLanguage, kanji, selectedVoice, selectedRate, debug, onProblemChange, onEnter } = $props();

    let lastProblemValue = null;

    let ja: boolean = $derived(selectedLanguage == 'ja-JP')

    let utteranceIndex: number = $state(0)

    let tokenSubstitutions = $derived(substitutions[selectedLanguage] || {})

    let speechTokens: string[] = $derived.by(() => {
        const safeTokens = getSanitizedTokens()
        const tempTokens: string[] = []
        const finalTokens: string[] = []

        safeTokens.forEach((token) => {
            if (token in tokenSubstitutions) {
                token = tokenSubstitutions[token]
            }
            tempTokens.push(token)
            if(token.match(digitRgx)) {
                finalTokens.push(tempTokens.join(" "))
                tempTokens.length = 0
            }
        })
        return finalTokens
    })

    // "Speak all" handler
    function onListenClicked() {
        if (!selectedVoice) {
            console.error('onListenClicked: unexpected unset selected voice')
            return
        }

        // For beginners I suspect inserting the comma here should be helpful; it adds just a tiny bit of pause.
        // Maybe not everyone will like it, but for now, let's do it.
        let fullPhrase = speechTokens.join(", ")
        speak(fullPhrase)
    }

    function onListenIncrementalClicked() {
        if (!selectedVoice) {
            console.error('onListenClicked: unexpected unset selected voice')
            return
        }

        speak(speechTokens[utteranceIndex])
        utteranceIndex = (utteranceIndex + 1) % speechTokens.length
    }

    function speak(phrase: string) {
        const utterance = new SpeechSynthesisUtterance(phrase)
        utterance.lang = selectedLanguage ?? "en-US"
        utterance.rate = selectedRate / 100
        utterance.voice = (selectedVoice as SpeechSynthesisVoice)
        window.speechSynthesis.speak(utterance)
    }

    function getSanitizedTokens(): string[] {
        /* Very simple: match on numbers (multidigit) and operators (singular).  Commas not (yet) supported. */
        return Array.from(problem.matchAll(validTokensRgx)).map(match => {
            return match[1]
        })
    }

    function sanitizeProblem(): string {
        return getSanitizedTokens().join(" ")
    }

    function onProblemInnerChange() {
        if (lastProblemValue != problem) {
            lastProblemValue = problem
            onProblemChange()
        }
    }

    function onkeyup(event) {
        if (event.key == "Enter") {
            onEnter()
        }
    }

    function getProblemWithAnswer(): string {
        const sanitizedProblem = sanitizeProblem()
        let answer
        try {
            answer = eval(sanitizedProblem)
        } catch (error) {
            answer = '<error>'
        }
        return `${sanitizedProblem} = ${answer}`
    }

    $effect(() => {
        // We read problem just as a trigger for this event:
        // when problem is updated, utteranceIndex should be reset to 0.
        const _ = problem;
        utteranceIndex = 0;
    })

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
    {#if viewMode=="edit"}
        <input class="problem-simple" bind:value={problem} type="text" autocomplete="off" oninput={onProblemInnerChange} {onkeyup} />
    {:else}
        {#if selectedVoice}
            {#if speechMode == "by-number"}
                <button onclick={onListenIncrementalClicked}>
                    {#if utteranceIndex==0}
                        {#if ja && kanji}聞き始める{:else if ja}ききはじめる{:else}Start listening{/if}
                    {:else}
                        {#if ja && kanji}もっと聞く{:else if ja}もっときく{:else}Continue listening{/if}
                    {/if}
                </button>
            {:else}
                <button onclick={onListenClicked}>{#if ja && kanji}聞く{:else if ja}きく{:else}Listen{/if}</button>
            {/if}
        {/if}
        <button onclick={() => {showAnswer = !showAnswer}}>{#if ja && kanji}答えを{#if showAnswer}隠す{:else}見せる{/if}{:else if ja}こたえを{#if showAnswer}かくす{:else}みせる{/if}{:else}{#if showAnswer}Hide{:else}Show{/if} answer{/if}</button>
        {#if showAnswer}
        <span class="answer">{getProblemWithAnswer()}</span>
        {/if}
    {/if}
    {#if debug}
        <span class="debug">
            Speech tokens: {JSON.stringify(speechTokens)}
        </span>
    {/if}
</div>
