export class ProblemState {
    problem: string;
    showAnswer: boolean;

    constructor(problem: string) {
        this.problem = $state(problem)
        this.showAnswer = $state(false)
    }
}