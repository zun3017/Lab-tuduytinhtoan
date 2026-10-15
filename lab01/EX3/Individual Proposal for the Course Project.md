<h1 align="center">Individual Proposal for the Course Project</h1> 

# Hồ Hoàng Tiến Dũng
#### My project will be about a Smart Adaptive Exam Preparation & Assessment Assistant that supports learners in building personalized study plans, identifying knowledge gaps via knowledge graphs, scheduling spaced repetition reviews, and looking up official examination regulations.

#### How it works

### Step 1: Collecting learner input and target goals

The assistant interacts with the learner to collect necessary information, including:

- Current proficiency level, mock test history, and target exam score.
- Daily available study hours, busy schedules, and target exam date (deadline).
- Self-assessed weak topics and preferred learning pace.
- Inquiries regarding exam blueprints, grading criteria, exemption policies, or examination room rules.

### Step 2: Analyzing knowledge graph and schedule constraint checking

The system applies directed acyclic graph (DAG) algorithms over a **Knowledge Graph** to trace concept prerequisite chains, accurately pinpointing root knowledge gaps. Next, a Constraint Satisfaction Problem (CSP) solver balances required learning volume against available study hours to avoid burnout. Meanwhile, mathematical spaced repetition algorithms (SM-2/FSRS) model the forgetting curve to schedule optimal review intervals for long-term retention.

### Step 3: Information retrieval for syllabus and exam regulations Q&A

For inquiries regarding exam formats, scoring rubrics, and testing policies, the system retrieves relevant information using RAG (LangChain, Vector DB) from official PDF documents such as the **Exam Syllabus**, **Scoring Rubrics / Band Descriptors**, and **Testing Code of Conduct**. It extracts precise information backed by direct section and page citations.

### Step 4: Automated scheduling and adaptive roadmap recommendation

The system synthesizes all data, utilizing AI to recommend daily conflict-free study timetables and adaptively dynamically adjust curriculum difficulty and weak-skill drill sets in real-time based on the student's ongoing test performance.

## 3. Output

The system provides users with:

- A personalized study roadmap and daily conflict-free timetables tailored to the learner's schedule.
- A knowledge graph diagnostic report highlighting missing prerequisite concepts.
- An optimized spaced-repetition review calendar and score probability projections before the exam date.
- Accurate answers regarding exam specifications and grading rubrics directly cited from official exam guidelines.
- Timely warnings when the current study pace risks missing the deadline or when study load causes cognitive overload.

## 4. Design principles

The system combines **graph algorithms and constraint satisfaction (Knowledge DAG, CSP, Spaced Repetition algorithms)** to ensure mathematical soundness in knowledge-gap diagnostics and workload scheduling, a **RAG retrieval framework (LangChain, Vector DB)** for strict exam guideline compliance, and an **AI assistant** to adapt curriculum content and provide personalized learning encouragement.
 