PGDMP  	                     }            Knotes    17.2    17.2 	    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    Knotes    DATABASE     |   CREATE DATABASE "Knotes" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Canada.1252';
    DROP DATABASE "Knotes";
                     postgres    false            �            1259    16426    Votes    TABLE     �   CREATE TABLE public."Votes" (
    vote_id integer NOT NULL,
    user_id integer NOT NULL,
    note_id integer NOT NULL,
    vote_type boolean
);
    DROP TABLE public."Votes";
       public         heap r       postgres    false            �          0    16426    Votes 
   TABLE DATA           G   COPY public."Votes" (vote_id, user_id, note_id, vote_type) FROM stdin;
    public               postgres    false    221   b	       e           2606    16430    Votes Votes_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT "Votes_pkey" PRIMARY KEY (vote_id);
 >   ALTER TABLE ONLY public."Votes" DROP CONSTRAINT "Votes_pkey";
       public                 postgres    false    221            f           2606    16436    Votes note_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT note_id FOREIGN KEY (note_id) REFERENCES public."Notes"(note_id) ON UPDATE CASCADE ON DELETE CASCADE;
 9   ALTER TABLE ONLY public."Votes" DROP CONSTRAINT note_id;
       public               postgres    false    221            g           2606    16431    Votes user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
 9   ALTER TABLE ONLY public."Votes" DROP CONSTRAINT user_id;
       public               postgres    false    221            �      x������ � �     