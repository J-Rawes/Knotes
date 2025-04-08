--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2025-04-08 16:05:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16394)
-- Name: Courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Courses" (
    course_id integer NOT NULL,
    course_name character varying(50) NOT NULL,
    institution character varying(50) NOT NULL,
    description text NOT NULL
);


ALTER TABLE public."Courses" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16453)
-- Name: Images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Images" (
    image_id integer NOT NULL,
    image bytea NOT NULL,
    note_id integer NOT NULL
);


ALTER TABLE public."Images" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16401)
-- Name: Notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notes" (
    note_id integer NOT NULL,
    title character varying(100) NOT NULL,
    num_likes integer NOT NULL,
    course_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public."Notes" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16475)
-- Name: Text; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Text" (
    text_id integer NOT NULL,
    text character varying NOT NULL,
    note_id integer NOT NULL
);


ALTER TABLE public."Text" OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16389)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    user_id integer NOT NULL,
    uname character varying(16) NOT NULL,
    pword character varying(100) NOT NULL,
    securityq character varying(100) NOT NULL,
    securityq_ans character varying(100) NOT NULL,
    liked_notes bigint[],
    liked_courses bigint[]
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16426)
-- Name: Votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Votes" (
    vote_id integer NOT NULL,
    user_id integer NOT NULL,
    note_id integer NOT NULL,
    vote_type boolean
);


ALTER TABLE public."Votes" OWNER TO postgres;

--
-- TOC entry 4880 (class 0 OID 16394)
-- Dependencies: 218
-- Data for Name: Courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Courses" (course_id, course_name, institution, description) FROM stdin;
1	Database Systems	Tech University	Learn about relational databases and SQL.
2	Machine Learning	AI Institute	Introduction to machine learning algorithms and applications.
3	Web Development	Code Academy	Front-end and back-end web development fundamentals.
4	Cybersecurity Basics	SecureTech	Understanding the principles of cybersecurity.
5	Data Structures	CompSci College	Study of essential data structures for computing.
\.


--
-- TOC entry 4883 (class 0 OID 16453)
-- Dependencies: 221
-- Data for Name: Images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Images" (image_id, image, note_id) FROM stdin;
\.


--
-- TOC entry 4881 (class 0 OID 16401)
-- Dependencies: 219
-- Data for Name: Notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notes" (note_id, title, num_likes, course_id, user_id) FROM stdin;
1	SQL Basics	10	1	1
2	Indexing Strategies	8	1	1
3	Normalization Concepts	15	1	1
4	Supervised Learning	12	2	1
5	Neural Networks	18	2	1
6	Clustering Methods	5	2	1
8	JavaScript Basics	14	3	1
9	Backend Frameworks	11	3	1
10	Threat Modeling	7	4	1
11	Encryption Techniques	13	4	1
12	Network Security	6	4	1
13	Linked Lists	10	5	1
14	Binary Trees	12	5	1
15	Graph Algorithms	9	5	1
16	Test Note	1	1	1
17	Test Note 2	1	1	1
18	Test Note 3	0	5	1
19	Test Note 3	1	5	3
7	HTML & CSS	10	3	1
\.


--
-- TOC entry 4884 (class 0 OID 16475)
-- Dependencies: 222
-- Data for Name: Text; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Text" (text_id, text, note_id) FROM stdin;
1	SQL stands for Structured Query Language.	1
2	SELECT is used to retrieve data from a database.	1
3	Indexes speed up search operations.	2
4	Primary keys create unique indexes automatically.	2
5	Normalization reduces data redundancy.	3
6	First normal form (1NF) ensures atomicity.	3
7	Supervised learning uses labeled datasets.	4
8	Regression and classification are common techniques.	4
9	Neural networks mimic human brain structures.	5
10	Activation functions introduce non-linearity.	5
11	K-Means is a popular clustering algorithm.	6
12	HTML provides structure to web pages.	7
13	CSS is used for styling web content.	7
14	JavaScript enables interactive web applications.	8
15	Frameworks like React and Vue simplify development.	9
16	Threat modeling identifies security risks.	10
17	Encryption ensures data confidentiality.	11
18	AES and RSA are common encryption algorithms.	11
19	Firewalls protect networks from attacks.	12
20	Linked lists consist of nodes linked together.	13
21	Binary trees have at most two children per node.	14
22	Graphs represent relationships between entities.	15
23	HCI\nConcerned w/ designing Computer Systems to match news (goals of People. diff. disciplines Draw from Knowledge / methods of many •Views . a model in are closely related which people, activities, technology e environmen Specifies design should be disciples & be highly iterative. Integrated PHI user. Centered, Knowledge from multiple Good Ul Should really have no need for explanation/document	16
24	UML\nImportant:\n- Goal Driven\n- Usability Testing	17
25	Hello World	18
26	HCI Concerned w/ designing Computer Systems to match news (goals) . of People. Draw from Knowledge / methods of many diff. disciplines ·Views a model in are closely related which people, activities, technology & Environment Specifies design should be disciples & be highly iterative. Integrated user. Centered, Knowledge From multiple Good UI should really have no need for explanation/documented	19
\.


--
-- TOC entry 4879 (class 0 OID 16389)
-- Dependencies: 217
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (user_id, uname, pword, securityq, securityq_ans, liked_notes, liked_courses) FROM stdin;
2	student2	2d850eb5460ffb6bb9ae11186a2d78cc22d9df387f9cdbd3a297e0d1ea08a54b	first_pet	57ddceaf971debc2993f2200bb697385ea038f9cab11ec280628cc05b03874ff	{}	{}
3	new user	32a65f4f49619fe19124d7cfc450a5dc7e2e8839d5f97da7d92bf528bd103d82	first_pet	57ddceaf971debc2993f2200bb697385ea038f9cab11ec280628cc05b03874ff	{19}	{5}
1	test student	f0e9c61b30f3a8e676bba2477329db6c47f490db8150fa6a1353f025bdddf4bd	street_grew_up	0816f406aee90cc3b5657133132aa9d9ffe43d067952cab0f0092828af395d25	{16,17,7}	{1,3}
\.


--
-- TOC entry 4882 (class 0 OID 16426)
-- Dependencies: 220
-- Data for Name: Votes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Votes" (vote_id, user_id, note_id, vote_type) FROM stdin;
\.


--
-- TOC entry 4719 (class 2606 OID 16488)
-- Name: Courses Courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Courses"
    ADD CONSTRAINT "Courses_pkey" PRIMARY KEY (course_id);


--
-- TOC entry 4725 (class 2606 OID 16459)
-- Name: Images Images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Images"
    ADD CONSTRAINT "Images_pkey" PRIMARY KEY (image_id);


--
-- TOC entry 4721 (class 2606 OID 16407)
-- Name: Notes Notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notes"
    ADD CONSTRAINT "Notes_pkey" PRIMARY KEY (note_id);


--
-- TOC entry 4727 (class 2606 OID 16481)
-- Name: Text Text_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Text"
    ADD CONSTRAINT "Text_pkey" PRIMARY KEY (text_id);


--
-- TOC entry 4715 (class 2606 OID 16393)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (user_id);


--
-- TOC entry 4723 (class 2606 OID 16430)
-- Name: Votes Votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT "Votes_pkey" PRIMARY KEY (vote_id);


--
-- TOC entry 4717 (class 2606 OID 16474)
-- Name: Users uname_uni; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT uname_uni UNIQUE (uname);


--
-- TOC entry 4728 (class 2606 OID 16489)
-- Name: Notes course_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notes"
    ADD CONSTRAINT course_id FOREIGN KEY (course_id) REFERENCES public."Courses"(course_id) NOT VALID;


--
-- TOC entry 4730 (class 2606 OID 16436)
-- Name: Votes note_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT note_id FOREIGN KEY (note_id) REFERENCES public."Notes"(note_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4732 (class 2606 OID 16460)
-- Name: Images note_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Images"
    ADD CONSTRAINT note_id FOREIGN KEY (note_id) REFERENCES public."Notes"(note_id);


--
-- TOC entry 4733 (class 2606 OID 16482)
-- Name: Text note_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Text"
    ADD CONSTRAINT note_id FOREIGN KEY (note_id) REFERENCES public."Notes"(note_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4731 (class 2606 OID 16431)
-- Name: Votes user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4729 (class 2606 OID 16500)
-- Name: Notes user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notes"
    ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) NOT VALID;


-- Completed on 2025-04-08 16:05:30

--
-- PostgreSQL database dump complete
--

