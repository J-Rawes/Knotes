PGDMP  7    ;                }            Knotes    17.2    17.2     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    Knotes    DATABASE     |   CREATE DATABASE "Knotes" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Canada.1252';
    DROP DATABASE "Knotes";
                     postgres    false            �            1259    16389    Users    TABLE     �   CREATE TABLE public."Users" (
    user_id integer NOT NULL,
    uname character varying(16) NOT NULL,
    pword character varying(16) NOT NULL
);
    DROP TABLE public."Users";
       public         heap r       postgres    false            �          0    16389    Users 
   TABLE DATA           8   COPY public."Users" (user_id, uname, pword) FROM stdin;
    public               postgres    false    217   x       e           2606    16393    Users Users_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (user_id);
 >   ALTER TABLE ONLY public."Users" DROP CONSTRAINT "Users_pkey";
       public                 postgres    false    217            �   "   x�3�����+.)MI�+�LLJ642����� t#h     