<script lang="ts">
    import { onMount } from 'svelte';
    import { ProblemState } from '../classes/ProblemState'

    const substitutions: Record<string,Record<string,string>> = {
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

    let lastProblemValue: ProblemState | null = null;

    let ja: boolean = $derived(selectedLanguage == 'ja-JP')

    let utteranceIndex: number = $state(0)

    let tokenSubstitutions = $derived(substitutions[selectedLanguage] || {})

    // Use this list for calculating in sequence
    // (no parens, no PEMDAS order of operations, but rather a simple "calculate in order I say"
    // calculation suitable for soroban purposes)
    let evalTokens: string[] = $derived.by(() => {
        const safeTokens = getSanitizedTokens()
        const tempTokens: string[] = []
        const finalTokens: string[] = []

        safeTokens.forEach((token) => {
            tempTokens.push(token)
            if(token.match(digitRgx)) {
                finalTokens.push(tempTokens.join(" "))
                tempTokens.length = 0
            }
        })
        return finalTokens
    })

    let speechTokens: string[] = $derived.by(() => {
        return evalTokens.map((token) => {
            for (const key in tokenSubstitutions) {
                const value = tokenSubstitutions[key]
                token = token.replace(key, value)
            }
            return token
        })
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
        if (selectedVoice) {
            const utterance = new SpeechSynthesisUtterance(phrase)
            utterance.lang = selectedLanguage ?? "en-US"
            utterance.rate = selectedRate / 100
            utterance.voice = selectedVoice
            window.speechSynthesis.speak(utterance)
        }
    }

    function getSanitizedTokens(): string[] {
        /* Very simple: match on numbers (multidigit) and operators (singular).  Commas not (yet) supported. */
        const matches: string[][] = Array.from(problem.matchAll(validTokensRgx))
        return matches.map(function (match: string[]): string {
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

    function onkeyup(event: KeyboardEvent) {
        console.log(typeof event)
        if (event.key == "Enter") {
            onEnter()
        }
    }

    function getProblemWithAnswer(): string {
        const sanitizedProblem = sanitizeProblem()
        let answer: string = "0"
        try {
            if (evalTokens.length > 0) {
                answer = eval(evalTokens[0]).toString()
            }
            // Simple eval: eval bit by bit.
            // I'm being lazy here and not implementing my own eval logic,
            // instead just re-using each intermediate answer
            // again in an eval expression.
            // My hope is this is "good enough" for this tool, but if not I
            // can always write a more proper parser later to remove the eval() usage.
            for (let i=1; i<evalTokens.length; i++) {
                answer = eval([answer, evalTokens[i]].join(" ")).toString()
            }
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
