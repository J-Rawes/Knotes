PGDMP      :                }            Knotes    17.2    17.2     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    Knotes    DATABASE     |   CREATE DATABASE "Knotes" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Canada.1252';
    DROP DATABASE "Knotes";
                     postgres    false            �            1259    16394    Courses    TABLE     �   CREATE TABLE public."Courses" (
    course_id character varying(10) NOT NULL,
    course_name character varying(50) NOT NULL,
    institution character varying(50) NOT NULL,
    notes text NOT NULL
);
    DROP TABLE public."Courses";
       public         heap r       postgres    false            �          0    16394    Courses 
   TABLE DATA           O   COPY public."Courses" (course_id, course_name, institution, notes) FROM stdin;
    public               postgres    false    218   �       e           2606    16400    Courses Courses_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public."Courses"
    ADD CONSTRAINT "Courses_pkey" PRIMARY KEY (course_id);
 B   ALTER TABLE ONLY public."Courses" DROP CONSTRAINT "Courses_pkey";
       public                 postgres    false    218            �      x������ � �     