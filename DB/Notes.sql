PGDMP      ;                }            Knotes    17.2    17.2     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    Knotes    DATABASE     |   CREATE DATABASE "Knotes" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Canada.1252';
    DROP DATABASE "Knotes";
                     postgres    false            �            1259    16401    Notes    TABLE     �   CREATE TABLE public."Notes" (
    note_id integer NOT NULL,
    course_id character varying(50) NOT NULL,
    title character varying(100) NOT NULL,
    content character varying NOT NULL,
    num_likes integer NOT NULL
);
    DROP TABLE public."Notes";
       public         heap r       postgres    false            �          0    16401    Notes 
   TABLE DATA           P   COPY public."Notes" (note_id, course_id, title, content, num_likes) FROM stdin;
    public               postgres    false    219   W       e           2606    16407    Notes Notes_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public."Notes"
    ADD CONSTRAINT "Notes_pkey" PRIMARY KEY (note_id);
 >   ALTER TABLE ONLY public."Notes" DROP CONSTRAINT "Notes_pkey";
       public                 postgres    false    219            f           2606    16408    Notes course_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."Notes"
    ADD CONSTRAINT course_id FOREIGN KEY (course_id) REFERENCES public."Courses"(course_id) ON UPDATE CASCADE ON DELETE CASCADE;
 ;   ALTER TABLE ONLY public."Notes" DROP CONSTRAINT course_id;
       public               postgres    false    219            �      x������ � �     